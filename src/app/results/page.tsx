"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  TrendingUp,
  MessageSquare,
  Code,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useInterviewStore } from "@/store/interview-store";
import { useInterviewHydration } from "@/hooks/use-interview-hydration";
import type { HiringRecommendation } from "@/lib/types";

const RECOMMENDATION_LABELS: Record<HiringRecommendation, { label: string; color: string }> = {
  "strong-hire": { label: "Strong Hire", color: "text-success bg-success/10 border-success/30" },
  hire: { label: "Hire", color: "text-success bg-success/10 border-success/30" },
  maybe: { label: "Maybe", color: "text-warning bg-warning/10 border-warning/30" },
  "no-hire": { label: "No Hire", color: "text-danger bg-danger/10 border-danger/30" },
};

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  const pct = (score / 10) * 100;
  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </div>
        <span className="font-mono text-lg font-bold">{score}/10</span>
      </div>
      <div className="h-2 rounded-full bg-card-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const hydrated = useInterviewHydration();
  const { session, config } = useInterviewStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/");
    }
  }, [hydrated, session, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading results...
      </div>
    );
  }

  if (!session || !config) return null;

  const evaluation = session.evaluation;
  const { job, candidate } = config;
  const duration = session.endedAt
    ? Math.round((session.endedAt - session.startedAt) / 1000)
    : 0;

  const rec = evaluation
    ? RECOMMENDATION_LABELS[evaluation.recommendation]
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      {/* Candidate-facing thank you */}
      <div className="mb-8 glass rounded-2xl p-6 text-center border border-accent/20">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
        <h1 className="text-2xl font-bold">Thank You, {candidate.fullName}</h1>
        <p className="mt-2 text-muted">
          Your interview for <strong>{job.role}</strong> at{" "}
          <strong>{job.companyName}</strong> is complete.
        </p>
        <p className="mt-1 text-sm text-muted">
          The hiring team will review your responses and be in touch.
        </p>
      </div>

      {/* Hiring team evaluation */}
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-muted uppercase tracking-wide text-sm">
          Hiring Team Evaluation
        </h2>
        <p className="mt-1 text-sm text-muted">
          {candidate.fullName} · {candidate.email} · {candidate.resume.fileName} ·{" "}
          {Math.floor(duration / 60)}m {duration % 60}s
        </p>
      </header>

      {evaluation && rec ? (
        <>
          <div className="mb-6 glass rounded-2xl p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold text-primary">
                {evaluation.overallScore}
              </div>
              <div className="flex-1">
                <div className={`inline-flex rounded-lg border px-3 py-1 text-sm font-semibold ${rec.color}`}>
                  {rec.label}
                </div>
                <p className="text-sm text-muted mt-2">{evaluation.summary}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <ScoreBar label="Communication" score={evaluation.communicationScore} icon={MessageSquare} />
            <ScoreBar label="Technical Fit" score={evaluation.technicalScore} icon={Code} />
            <ScoreBar label="Resume Alignment" score={evaluation.resumeAlignmentScore} icon={FileCheck} />
          </div>

          {evaluation.resumeVerification.length > 0 && (
            <div className="mb-6 glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <FileCheck className="h-4 w-4 text-primary" />
                Resume Verification
              </div>
              <ul className="space-y-2">
                {evaluation.resumeVerification.map((item, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-primary shrink-0">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2 font-medium text-success">
                <TrendingUp className="h-4 w-4" />
                Strengths
              </div>
              <ul className="space-y-2">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-success">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2 font-medium text-warning">
                <AlertTriangle className="h-4 w-4" />
                Concerns
              </div>
              <ul className="space-y-2">
                {evaluation.concerns.map((s, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-warning">!</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="mb-6 glass rounded-xl p-6 text-center">
          <p className="text-muted">
            {session.evaluationError
              ? session.evaluationError
              : "Evaluation could not be generated. Review the transcript below."}
          </p>
          {session.evaluationError?.includes("API") && (
            <p className="mt-2 text-xs text-muted">
              If using Azure, add AZURE_OPENAI_CHAT_DEPLOYMENT to .env (e.g. gpt-4o-mini).
            </p>
          )}
        </div>
      )}

      <div className="glass rounded-xl p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Interview Transcript
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {session.transcript.map((entry) => (
            <div key={entry.id} className="text-sm">
              <span className="font-medium capitalize text-primary">
                {entry.role === "user" ? candidate.fullName : "Interviewer"}:
              </span>{" "}
              <span className="text-muted">{entry.text}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
