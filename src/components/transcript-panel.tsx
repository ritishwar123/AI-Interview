"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/types";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (!entries.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Transcript will appear here as you speak...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-1">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`rounded-xl px-4 py-3 text-sm ${
            entry.role === "user"
              ? "ml-4 bg-accent/10 border border-accent/20"
              : "mr-4 bg-primary/10 border border-primary/20"
          }`}
        >
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            {entry.role === "user" ? "You" : "Interviewer"}
          </div>
          <p className="leading-relaxed">{entry.text}</p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
