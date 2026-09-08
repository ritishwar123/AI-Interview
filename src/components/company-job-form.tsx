"use client";

import { useState } from "react";
import { Copy, Check, Link2, Trash2, Briefcase } from "lucide-react";
import { useJobStore } from "@/store/job-store";
import { buildApplyUrl } from "@/lib/job-url";
import type { InterviewType, Persona } from "@/lib/types";

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "system-design", label: "System Design" },
  { value: "mixed", label: "Mixed" },
];

const PERSONAS: { value: Persona; label: string; desc: string }[] = [
  { value: "hr", label: "HR Screening", desc: "Initial culture & fit screen" },
  { value: "hiring-manager", label: "Hiring Manager", desc: "Role fit evaluation" },
  { value: "tech-lead", label: "Technical Lead", desc: "Deep technical assessment" },
];

export function CompanyJobForm() {
  const { jobs, addJob, removeJob } = useJobStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    role: "",
    jobDescription: "",
    interviewType: "mixed" as InterviewType,
    persona: "hiring-manager" as Persona,
    durationMinutes: 20,
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = () => {
    const job = addJob(form);
    const link = buildApplyUrl(job);
    setCreatedLink(link);
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getJobLink = (job: ReturnType<typeof addJob>) => buildApplyUrl(job);

  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Create Interview Position</h2>
            <p className="text-sm text-muted">
              Set up a role — candidates upload their resume and get tailored questions
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company Name" required>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="Acme Corp"
              className="input-field"
            />
          </Field>

          <Field label="Role Title" required>
            <input
              type="text"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="Senior Software Engineer"
              className="input-field"
            />
          </Field>

          <Field label="Interview Type">
            <select
              value={form.interviewType}
              onChange={(e) => update("interviewType", e.target.value as InterviewType)}
              className="input-field"
            >
              {INTERVIEW_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Duration">
            <select
              value={form.durationMinutes}
              onChange={(e) => update("durationMinutes", Number(e.target.value))}
              className="input-field"
            >
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
            </select>
          </Field>

          <Field label="Interviewer Type" className="sm:col-span-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update("persona", p.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    form.persona === p.value
                      ? "border-primary bg-primary/10"
                      : "border-card-border hover:border-muted"
                  }`}
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Job Description" required className="sm:col-span-2">
            <textarea
              value={form.jobDescription}
              onChange={(e) => update("jobDescription", e.target.value)}
              placeholder="Paste the full job description — used alongside the candidate's resume to generate questions..."
              rows={6}
              className="input-field resize-none"
            />
          </Field>
        </div>

        <button
          onClick={handleCreate}
          disabled={!form.companyName.trim() || !form.role.trim() || !form.jobDescription.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Link2 className="h-5 w-5" />
          Create & Generate Candidate Link
        </button>

        {createdLink && (
          <div className="mt-4 rounded-xl border border-success/30 bg-success/5 p-4">
            <p className="text-sm font-medium text-success mb-2">Candidate link created!</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdLink}
                className="input-field text-xs font-mono flex-1"
              />
              <button
                onClick={() => copyLink(createdLink, "new")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                {copiedId === "new" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Send this link to candidates. They will upload their resume and begin the interview.
            </p>
          </div>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Active Positions</h3>
          <div className="space-y-3">
            {jobs.map((job) => {
              const link = getJobLink(job);
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-card-border p-4"
                >
                  <div>
                    <p className="font-medium">{job.role}</p>
                    <p className="text-sm text-muted">{job.companyName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(link, job.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-card-border px-3 py-1.5 text-sm hover:bg-card transition-colors"
                    >
                      {copiedId === job.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copy Link
                    </button>
                    <button
                      onClick={() => removeJob(job.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
