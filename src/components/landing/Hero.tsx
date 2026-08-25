"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-5 py-20 font-sans md:px-8 md:py-28">
      <div className="max-w-4xl">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-primary">AI Resume Builder</p>
        <h1 className="mb-7 text-5xl font-bold leading-[0.95] tracking-[-0.06em] text-foreground md:text-7xl">
          Build from evidence. <span className="text-accent-gray">Tailor with context.</span>
        </h1>
        <p className="max-w-2xl text-base leading-7 text-accent-dark md:text-lg">
          Import your resume, review it against clear criteria, compare it with a job description, and approve every suggested change before it is applied.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          {session ? (
            <Link href="/dashboard" className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark">
              Go to Dashboard
            </Link>
          ) : (
            <button onClick={() => window.dispatchEvent(new Event("open-auth"))} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-dark">
              Get Started
            </button>
          )}
          <Link href="#compare" className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-neutral-50">
            See how it works
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3" aria-label="Core product workflow">
        {[
          ["1", "Add your evidence", "Import a resume or build structured projects, education, skills, and work history."],
          ["2", "Review the gaps", "See applicable rubric checks and job-description coverage without fabricated claims."],
          ["3", "Approve the changes", "Edit, accept, or reject each suggestion before exporting a tailored PDF."],
        ].map(([number, title, description]) => (
          <div key={number} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <span className="text-xs font-bold text-muted-foreground">{number}</span>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
