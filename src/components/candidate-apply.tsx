"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mic, Building2 } from "lucide-react";
import { ResumeUpload } from "@/components/resume-upload";
import { useInterviewStore } from "@/store/interview-store";
import type { InterviewConfig, JobPosting, ParsedResume } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface CandidateApplyProps {
  job: JobPosting;
}

export function CandidateApply({ job }: CandidateApplyProps) {
  const router = useRouter();
  const { setConfig, startSession } = useInterviewStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<ParsedResume | null>(null);

  const canStart = fullName.trim() && email.trim() && resume;

  const handleStart = () => {
    if (!canStart || !resume) return;

    const config: InterviewConfig = {
      job,
      candidate: { fullName: fullName.trim(), email: email.trim(), resume },
    };

    setConfig(config);
    startSession({
      id: generateId(),
      config,
      transcript: [],
      startedAt: Date.now(),
    });
    router.push("/interview");
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 shrink-0">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted">{job.companyName}</p>
            <h2 className="text-xl font-semibold">{job.role}</h2>
            <p className="mt-2 text-sm text-muted line-clamp-3">
              {job.jobDescription}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
              <span className="rounded-md bg-card-border/50 px-2 py-1 capitalize">
                {job.interviewType.replace("-", " ")}
              </span>
              <span className="rounded-md bg-card-border/50 px-2 py-1">
                {job.durationMinutes} min
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h3 className="text-lg font-semibold mb-1">Your Application</h3>
        <p className="text-sm text-muted mb-6">
          Upload your resume — interview questions will be based on your experience.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 mb-6">
          <Field label="Full Name" required>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="input-field"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@email.com"
              className="input-field"
            />
          </Field>
        </div>

        <Field label="Resume" required>
          <ResumeUpload
            resume={resume}
            onResumeParsed={setResume}
            onClear={() => setResume(null)}
          />
        </Field>

        <button
          onClick={handleStart}
          disabled={!canStart}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="h-5 w-5" />
          Begin Interview
        </button>

        <p className="mt-4 text-center text-xs text-muted">
          By starting, you consent to this AI-assisted interview being recorded and
          reviewed by {job.companyName}&apos;s hiring team.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
