import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion, getChatConfig } from "@/lib/chat-config";
import { buildEvaluationPrompt } from "@/lib/prompts";
import type { HiringEvaluation, InterviewConfig } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const chat = getChatConfig();
    if (!chat) {
      return NextResponse.json(
        {
          error:
            "Chat API not configured. Add OPENAI_API_KEY for evaluation, or set AZURE_OPENAI_CHAT_DEPLOYMENT with your Azure credentials.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const config: InterviewConfig = body.config;
    const transcript: { role: string; text: string }[] = body.transcript ?? [];

    if (!config?.job || !config?.candidate?.resume) {
      return NextResponse.json(
        { error: "Invalid interview configuration." },
        { status: 400 }
      );
    }

    if (!transcript.length) {
      return NextResponse.json(
        { error: "No transcript provided for evaluation." },
        { status: 400 }
      );
    }

    const prompt = buildEvaluationPrompt(config, transcript);

    const data = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are a senior hiring manager producing official candidate evaluations. Respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty evaluation response" },
        { status: 500 }
      );
    }

    const evaluation: HiringEvaluation = JSON.parse(content);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Evaluation route error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to generate evaluation", details: message },
      { status: 500 }
    );
  }
}
