"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import type { ParsedResume } from "@/lib/types";

interface ResumeUploadProps {
  resume: ParsedResume | null;
  onResumeParsed: (resume: ParsedResume) => void;
  onClear: () => void;
}

export function ResumeUpload({ resume, onResumeParsed, onClear }: ResumeUploadProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsParsing(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to parse resume");
        }

        onResumeParsed({
          rawText: data.rawText,
          fileName: data.fileName,
          summary: data.summary,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
          projects: data.projects,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsParsing(false);
      }
    },
    [onResumeParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  if (resume) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">{resume.fileName}</p>
              {resume.summary && (
                <p className="mt-1 text-xs text-muted line-clamp-2">{resume.summary}</p>
              )}
              {resume.skills && resume.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {resume.skills.slice(0, 8).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                  {resume.skills.length > 8 && (
                    <span className="text-xs text-muted">+{resume.skills.length - 8} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-muted hover:text-foreground transition-colors"
            title="Remove resume"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-card-border hover:border-primary/50 hover:bg-card/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseFile(file);
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted">Analyzing your resume...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Upload your resume</p>
              <p className="mt-1 text-sm text-muted">
                Drag & drop or click to browse · PDF, DOCX, or TXT · Max 5MB
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <FileText className="h-3.5 w-3.5" />
              Questions will be tailored to your resume
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
