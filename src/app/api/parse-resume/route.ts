import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { createChatCompletion, getChatConfig } from "@/lib/chat-config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function analyzeResumeText(rawText: string) {
  const data = await createChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "Extract structured information from resumes. Respond with valid JSON only.",
      },
      {
        role: "user",
        content: `Extract from this resume:\n\n${rawText.slice(0, 6000)}\n\nJSON format:
{
  "summary": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": ["Company - Role - key detail"],
  "education": ["Degree - Institution"],
  "projects": ["Project name - brief description"]
}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  return JSON.parse(content);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file =
      (formData.get("file") as File | null) ??
      (formData.get("resume") as File | null);

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        {
          error: "No file uploaded",
          hint: 'Send the resume as form-data with key "file" (or "resume")',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let rawText = "";

    if (fileName.endsWith(".pdf")) {
      rawText = await extractPdfText(buffer);
    } else if (fileName.endsWith(".docx")) {
      rawText = await extractDocxText(buffer);
    } else if (fileName.endsWith(".txt")) {
      rawText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    rawText = rawText.trim();

    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from the resume. Try a different file." },
        { status: 400 }
      );
    }

    let analysis = null;

    if (getChatConfig()) {
      try {
        analysis = await analyzeResumeText(rawText);
      } catch {
        // analysis is optional — raw text is sufficient
      }
    }

    return NextResponse.json({
      rawText,
      fileName: file.name,
      ...analysis,
    });
  } catch (error) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
