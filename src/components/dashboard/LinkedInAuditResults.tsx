"use client";

import { LINKEDIN_AUDIT_CATEGORIES, type LinkedInAuditCategory, type LinkedInAuditItem, type LinkedInPersona } from "@/lib/linkedin-audit-rubric";

export interface LinkedInAuditResult {
  rubricVersion: string;
  persona: LinkedInPersona;
  summary: string;
  items: LinkedInAuditItem[];
  scores: { overall: number | null; categories: Record<LinkedInAuditCategory, number | null>; assessed: number; total: number };
}

const labels: Record<LinkedInAuditCategory, string> = {
  identity: "Profile identity", headline: "Headline", about: "About", experience: "Experience",
  skills: "Skills", education: "Education & featured", network: "Network & proof",
  activity: "Activity & content", seo: "Discoverability & links",
};
const statusColor: Record<LinkedInAuditItem["status"], string> = {
  Pass: "bg-emerald-50 text-emerald-800", Partial: "bg-amber-50 text-amber-800",
  Fail: "bg-rose-50 text-rose-800", "Not Applicable": "bg-neutral-100 text-neutral-600",
  "Not Assessed": "bg-sky-50 text-sky-800",
};

export function LinkedInAuditResults({ result }: { result: LinkedInAuditResult }) {
  const actions = result.items.filter(item => item.status === "Fail" || item.status === "Partial")
    .sort((a, b) => b.weight - a.weight).slice(0, 5);
  return <div className="space-y-6">
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Profile audit</p>
          <h2 className="mt-2 text-3xl font-semibold text-neutral-950">{result.scores.overall == null ? "Not scored" : `${result.scores.overall}/100`}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{result.summary}</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">{result.persona.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
      </div>
      <p className="mt-5 text-xs text-neutral-500">Score uses {result.scores.assessed} assessable checks out of {result.scores.total}. Review “Not Assessed” items directly on LinkedIn. This is a profile quality benchmark, not a prediction of LinkedIn search rank.</p>
    </section>

    {actions.length > 0 && <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Start with these fixes</h3>
      <ol className="mt-4 space-y-3">{actions.map(item => <li key={item.id} className="rounded-2xl bg-[#FAF9F6] p-4">
        <p className="text-sm font-semibold">{item.checkpoint}</p>
        <p className="mt-1 text-sm text-neutral-600">{item.fix || "Review and improve this section with specific evidence."}</p>
      </li>)}</ol>
    </section>}

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Category scores">
      {LINKEDIN_AUDIT_CATEGORIES.map(category => <div key={category} className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{labels[category]}</span><strong className="text-sm">{result.scores.categories[category] == null ? "—" : `${result.scores.categories[category]}%`}</strong></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-neutral-900" style={{ width: `${result.scores.categories[category] || 0}%` }} /></div>
      </div>)}
    </section>

    <section className="space-y-3" aria-label="All audit checks">
      {LINKEDIN_AUDIT_CATEGORIES.map(category => {
        const items = result.items.filter(item => item.category === category);
        return <details key={category} className="rounded-2xl border border-neutral-200 bg-white p-5" open={category === "headline" || category === "about"}>
          <summary className="cursor-pointer font-semibold">{labels[category]} <span className="ml-2 text-xs font-normal text-neutral-500">{items.length} checks</span></summary>
          <div className="mt-4 divide-y divide-neutral-100">{items.map(item => <div key={item.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-start justify-between gap-2"><p className="max-w-2xl text-sm font-medium">{item.checkpoint}</p><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[item.status]}`}>{item.status}</span></div>
            <p className="mt-1 text-xs text-neutral-500">{item.evidence}</p>
            {item.fix && item.status !== "Pass" && item.status !== "Not Applicable" && <p className="mt-1 text-sm text-neutral-700">Next: {item.fix}</p>}
          </div>)}</div>
        </details>;
      })}
    </section>
  </div>;
}
