import { NextRequest, NextResponse } from "next/server";
import {
  buildInterviewInstructions,
  getVoiceForPersona,
} from "@/lib/prompts";
import {
  getRealtimeConfig,
  resolveRealtimeVoice,
} from "@/lib/realtime-config";
import type { InterviewConfig } from "@/lib/types";

function buildSessionBody(instructions: string, model: string, voice: string) {
  return {
    session: {
      type: "realtime",
      model,
      instructions,
      audio: {
        input: {
          transcription: {
            model: "whisper-1",
            language: "en",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.65,
            prefix_padding_ms: 300,
            silence_duration_ms: 1200,
            create_response: false,
          },
        },
        output: {
          voice,
        },
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const realtime = getRealtimeConfig();
    if (!realtime) {
      return NextResponse.json(
        {
          error:
            "Realtime API not configured. Set AZURE_OPENAI_* vars or OPENAI_API_KEY.",
        },
        { status: 500 }
      );
    }

    const config: InterviewConfig = await request.json();
    const instructions = buildInterviewInstructions(config);
    const voice = resolveRealtimeVoice(
      getVoiceForPersona(config.job.persona),
      realtime
    );

    const response = await fetch(realtime.clientSecretsUrl, {
      method: "POST",
      headers: {
        ...realtime.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildSessionBody(instructions, realtime.model, voice)
      ),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Realtime client_secrets error:", errorText);
      return NextResponse.json(
        { error: "Failed to create realtime session", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      ...data,
      webrtc_calls_url: realtime.webrtcCallsUrl,
    });
  } catch (error) {
    console.error("Session route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
