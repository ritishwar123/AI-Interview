"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  Loader2,
} from "lucide-react";
import { useRealtimeInterview } from "@/hooks/use-realtime-interview";
import { useInterviewStore } from "@/store/interview-store";
import { TranscriptPanel } from "@/components/transcript-panel";
import { VoiceVisualizer } from "@/components/voice-visualizer";
import { formatDuration } from "@/lib/utils";
import { useInterviewHydration } from "@/hooks/use-interview-hydration";

export function InterviewSession() {
  const router = useRouter();
  const hydrated = useInterviewHydration();
  const {
    session,
    config,
    connectionStatus,
    elapsedSeconds,
    error,
    addTranscriptEntry,
    updateTranscriptEntry,
    setConnectionStatus,
    setError,
    setElapsedSeconds,
    endSession,
    setEvaluation,
    setEvaluationError,
  } = useInterviewStore();

  const [isGeneratingEvaluation, setIsGeneratingEvaluation] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasConnected = useRef(false);

  const handleTranscriptAppend = useCallback(
    (id: string, delta: string) => {
      const entry = session?.transcript.find((e) => e.id === id);
      if (entry) {
        updateTranscriptEntry(id, entry.text + delta);
      }
    },
    [session?.transcript, updateTranscriptEntry]
  );

  const { connect, disconnect, toggleMute, isMuted } = useRealtimeInterview({
    config: config!,
    onTranscriptUpdate: addTranscriptEntry,
    onTranscriptAppend: handleTranscriptAppend,
    onTranscriptFinalize: updateTranscriptEntry,
    onStatusChange: setConnectionStatus,
    onError: setError,
  });

  useEffect(() => {
    if (!hydrated) return;

    if (!session || !config) {
      router.replace("/");
      return;
    }

    if (!hasConnected.current) {
      hasConnected.current = true;
      connect();
    }
  }, [hydrated, session, config, router, connect]);

  useEffect(() => {
    if (
      connectionStatus !== "connected" &&
      connectionStatus !== "listening" &&
      connectionStatus !== "speaking"
    ) {
      return;
    }

    timerRef.current = setInterval(() => {
      const current = useInterviewStore.getState().elapsedSeconds;
      setElapsedSeconds(current + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionStatus, setElapsedSeconds]);

  const handleEnd = async () => {
    disconnect();
    endSession();

    const transcript = useInterviewStore.getState().session?.transcript ?? [];
    if (transcript.length === 0) {
      router.push("/");
      return;
    }

    setIsGeneratingEvaluation(true);
    setEvaluationError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          transcript: transcript.map((t) => ({ role: t.role, text: t.text })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setEvaluation(data);
      } else {
        const msg = [data.error, data.details].filter(Boolean).join(": ");
        setEvaluationError(msg || "Failed to generate evaluation");
      }
    } catch {
      setEvaluationError("Could not reach the evaluation service. Check your API configuration.");
    } finally {
      setIsGeneratingEvaluation(false);
      router.push("/results");
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading interview...
      </div>
    );
  }

  if (!session || !config) return null;

  const { job, candidate } = config;
  const maxSeconds = job.durationMinutes * 60;
  const isOvertime = elapsedSeconds > maxSeconds;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="w-20" />

        <div className="text-center">
          <p className="text-xs text-muted">{job.companyName}</p>
          <h1 className="font-semibold">{job.role}</h1>
          <p className="text-xs text-muted">{candidate.fullName}</p>
        </div>

        <div
          className={`flex w-20 items-center justify-end gap-1.5 text-sm font-mono ${
            isOvertime ? "text-warning" : "text-muted"
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatDuration(elapsedSeconds)}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
          {error.includes("OPENAI_API_KEY") && (
            <p className="mt-1 text-xs">
              Create a <code className="text-danger/80">.env.local</code> file with your OpenAI API key.
            </p>
          )}
        </div>
      )}

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-8">
          <VoiceVisualizer status={connectionStatus} />

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={toggleMute}
              disabled={connectionStatus === "connecting" || connectionStatus === "idle"}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-card-border bg-card transition-colors hover:bg-card-border disabled:opacity-50"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 text-danger" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={handleEnd}
              disabled={isGeneratingEvaluation}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white transition-colors hover:bg-danger/80 disabled:opacity-50"
              title="End interview"
            >
              {isGeneratingEvaluation ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <PhoneOff className="h-6 w-6" />
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted max-w-xs">
            Official interview for {job.companyName}. Speak clearly and reference
            your experience. Use headphones to avoid echo.
          </p>
        </div>

        <div className="glass flex flex-col rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Live Transcript
          </h2>
          <div className="flex-1 min-h-[300px] max-h-[500px]">
            <TranscriptPanel entries={session.transcript} />
          </div>
        </div>
      </div>
    </div>
  );
}
