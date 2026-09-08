import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanyJobForm } from "@/components/company-job-form";

export default function CompanyPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold">Company Portal</h1>
          <p className="mt-2 text-muted">
            Create interview positions and share links with candidates.
          </p>
        </header>

        <CompanyJobForm />
      </div>
    </main>
  );
}
