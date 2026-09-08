"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { CandidateApply } from "@/components/candidate-apply";
import { decodeJobFromUrl } from "@/lib/job-url";

function ApplyContent() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("job");

  if (!encoded) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="h-10 w-10 text-warning mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Invalid Interview Link</h2>
        <p className="mt-2 text-sm text-muted">
          This link is missing job information. Please use the link provided by the company.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-primary hover:underline"
        >
          Go to homepage
        </Link>
      </div>
    );
  }

  const job = decodeJobFromUrl(encoded);

  if (!job) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="h-10 w-10 text-danger mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Link Expired or Invalid</h2>
        <p className="mt-2 text-sm text-muted">
          Could not load job details. Ask your recruiter for a new interview link.
        </p>
      </div>
    );
  }

  return <CandidateApply job={job} />;
}

export default function ApplyPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Interview Application</h1>
          <p className="mt-2 text-sm text-muted">
            Upload your resume to begin your voice interview
          </p>
        </header>

        <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
          <ApplyContent />
        </Suspense>
      </div>
    </main>
  );
}
