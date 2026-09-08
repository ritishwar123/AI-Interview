import Link from "next/link";
import { Building2, UserCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-card-border bg-card/50 px-4 py-1.5 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            AI-Powered Hiring Platform
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Interview Assistant
          </h1>
          <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            Automate first-round interviews with speech-to-speech AI.
            Questions are generated from each candidate&apos;s resume — not generic templates.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/company"
            className="glass group rounded-2xl p-8 transition-all hover:border-primary/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">I&apos;m Hiring</h2>
            <p className="mt-2 text-sm text-muted">
              Create a job posting, generate a candidate link, and review AI evaluation reports.
            </p>
            <div className="mt-4 flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
              Company Portal <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <div className="glass rounded-2xl p-8 opacity-90">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 mb-4">
              <UserCircle className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-semibold">I&apos;m a Candidate</h2>
            <p className="mt-2 text-sm text-muted">
              Use the interview link sent by the company. You&apos;ll upload your resume
              and questions will be tailored to your background.
            </p>
            <p className="mt-4 text-xs text-muted">
              Don&apos;t have a link? Contact your recruiter.
            </p>
          </div>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Resume-Driven Questions",
              desc: "Every question references the candidate's actual experience and projects.",
            },
            {
              title: "Speech-to-Speech",
              desc: "Natural voice interviews — no forms or typing required.",
            },
            {
              title: "Hiring Evaluation",
              desc: "Automated scoring, resume verification, and hire/no-hire recommendations.",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass rounded-xl p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
