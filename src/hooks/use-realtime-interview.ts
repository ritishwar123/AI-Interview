"use client";

import { useCallback, useRef, useState } from "react";
import { generateId } from "@/lib/utils";
import type { ConnectionStatus, InterviewConfig, TranscriptEntry } from "@/lib/types";

interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface UseRealtimeInterviewOptions {
  config: InterviewConfig;
  onTranscriptUpdate: (entry: TranscriptEntry) => void;
  onTranscriptAppend: (id: string, delta: string) => void;
  onTranscriptFinalize: (id: string, text: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (message: string) => void;
}

const PHANTOM_PHRASE =
  /^(thanks?\.?|thank you\.?|hello\.?|hi\.?|hey\.?|okay\.?|ok\.?|um+\.?|uh+\.?|yes\.?|yeah\.?)$/i;

function isPhantomTranscript(text: string, msSinceAssistantDone: number): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const words = trimmed.split(/\s+/);
  const recentlyAfterAssistant = msSinceAssistantDone < 5000;

  if (recentlyAfterAssistant && PHANTOM_PHRASE.test(trimmed)) {
    return true;
  }

  // Echo/noise often produces 1–2 word fragments right after the AI speaks
  if (recentlyAfterAssistant && words.length <= 2 && trimmed.length < 20) {
    return true;
  }

  return false;
}

export function useRealtimeInterview({
  config,
  onTranscriptUpdate,
  onTranscriptAppend,
  onTranscriptFinalize,
  onStatusChange,
  onError,
}: UseRealtimeInterviewOptions) {
  const [isMuted, setIsMuted] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeItemIds = useRef<Map<string, "user" | "assistant">>(new Map());
  const userMutedRef = useRef(false);
  const assistantDoneAtRef = useRef(0);
  const responseInFlightRef = useRef(false);

  const setMicPassthrough = useCallback((enabled: boolean) => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = enabled && !userMutedRef.current;
    }
  }, []);

  const sendResponse = useCallback((instructions?: string) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open" || responseInFlightRef.current) return;

    responseInFlightRef.current = true;
    const payload: Record<string, unknown> = { type: "response.create" };
    if (instructions) {
      payload.response = { instructions };
    }
    dc.send(JSON.stringify(payload));
  }, []);

  const cleanup = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
    activeItemIds.current.clear();
    responseInFlightRef.current = false;
    assistantDoneAtRef.current = 0;
  }, []);

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case "response.output_audio.delta":
        case "response.audio.delta":
          setMicPassthrough(false);
          onStatusChange("speaking");
          break;

        case "response.output_audio.done":
        case "response.audio.done":
          onStatusChange("listening");
          break;

        case "response.done":
          responseInFlightRef.current = false;
          assistantDoneAtRef.current = Date.now();
          setMicPassthrough(true);
          onStatusChange("listening");
          break;

        case "input_audio_buffer.speech_started":
          onStatusChange("listening");
          break;

        case "conversation.item.input_audio_transcription.completed": {
          const itemId = event.item_id as string;
          const transcript = (event.transcript as string)?.trim();
          if (!transcript) break;

          const msSinceAssistant = Date.now() - assistantDoneAtRef.current;
          if (isPhantomTranscript(transcript, msSinceAssistant)) {
            break;
          }

          onTranscriptUpdate({
            id: itemId || generateId(),
            role: "user",
            text: transcript,
            timestamp: Date.now(),
          });
          sendResponse();
          break;
        }

        case "response.output_audio_transcript.delta":
        case "response.audio_transcript.delta": {
          const itemId = (event.item_id as string) || generateId();
          const delta = event.delta as string;
          if (!activeItemIds.current.has(itemId)) {
            activeItemIds.current.set(itemId, "assistant");
            onTranscriptUpdate({
              id: itemId,
              role: "assistant",
              text: delta,
              timestamp: Date.now(),
            });
          } else {
            onTranscriptAppend(itemId, delta);
          }
          break;
        }

        case "response.output_audio_transcript.done":
        case "response.audio_transcript.done": {
          const itemId = event.item_id as string;
          const transcript = event.transcript as string;
          if (itemId && transcript) {
            if (activeItemIds.current.has(itemId)) {
              onTranscriptFinalize(itemId, transcript);
            } else {
              activeItemIds.current.set(itemId, "assistant");
              onTranscriptUpdate({
                id: itemId,
                role: "assistant",
                text: transcript,
                timestamp: Date.now(),
              });
            }
          }
          break;
        }

        case "error": {
          responseInFlightRef.current = false;
          setMicPassthrough(true);
          const message =
            (event.error as { message?: string })?.message ?? "Realtime API error";
          onError(message);
          break;
        }
      }
    },
    [
      onTranscriptUpdate,
      onTranscriptAppend,
      onTranscriptFinalize,
      onStatusChange,
      onError,
      sendResponse,
      setMicPassthrough,
    ]
  );

  const connect = useCallback(async () => {
    try {
      onStatusChange("connecting");
      cleanup();

      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json();
        const detail = err.details ? `: ${err.details}` : "";
        throw new Error(`${err.error ?? "Failed to create session"}${detail}`);
      }

      const sessionData = await sessionRes.json();
      const ephemeralKey =
        sessionData.value ?? sessionData.client_secret?.value;

      if (!ephemeralKey) {
        throw new Error("No ephemeral key received from OpenAI");
      }

      const webrtcCallsUrl =
        sessionData.webrtc_calls_url ??
        "https://api.openai.com/v1/realtime/calls";

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data) as RealtimeEvent;
          handleEvent(event);
        } catch {
          // ignore malformed events
        }
      });

      dc.addEventListener("open", () => {
        onStatusChange("connected");
        setMicPassthrough(false);
        sendResponse(
          "Opening turn only: one short sentence intro plus one resume-based question. Do not preamble or think aloud."
        );
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(webrtcCallsUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text();
        throw new Error(`WebRTC connection failed: ${errText}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (err) {
      cleanup();
      const message = err instanceof Error ? err.message : "Connection failed";
      onError(message);
    }
  }, [config, cleanup, handleEvent, onStatusChange, onError, sendResponse, setMicPassthrough]);

  const disconnect = useCallback(() => {
    cleanup();
    onStatusChange("ended");
  }, [cleanup, onStatusChange]);

  const toggleMute = useCallback(() => {
    userMutedRef.current = !userMutedRef.current;
    setIsMuted(userMutedRef.current);
    setMicPassthrough(!userMutedRef.current && !responseInFlightRef.current);
  }, [setMicPassthrough]);

  return {
    connect,
    disconnect,
    toggleMute,
    isMuted,
  };
}
