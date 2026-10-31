"use client";

import { featureChrome } from "@/components/dashboard/feature-chrome";
import { LINKEDIN_AUDIT_CATEGORIES, type LinkedInAuditCategory, type LinkedInAuditItem, type LinkedInPersona } from "@/lib/linkedin-audit-rubric";

export interface LinkedInAuditResult {
  rubricVersion: string;
  persona: LinkedInPersona;
  summary: string;
  items: LinkedInAuditItem[];
  scores: { overall: number | null; categories: Record<LinkedInAuditCategory, number | null>; assessed: number; total: number };
  workEvidence?: Array<{ id: string; title: string; category: string }>;
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
    <section className={`${featureChrome.card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className={featureChrome.helper}>Profile audit</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{result.scores.overall == null ? "Not scored" : `${result.scores.overall}/100`}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{result.summary}</p>
        </div>
        <span className="rounded-xl bg-muted px-3 py-1 text-xs font-medium text-foreground">{result.persona.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
      </div>
      <p className={`mt-5 ${featureChrome.helper}`}>Score uses {result.scores.assessed} assessable checks out of {result.scores.total}. Review “Not Assessed” items directly on LinkedIn. This is a profile quality benchmark, not a prediction of LinkedIn search rank.</p>
    </section>

    {result.workEvidence && result.workEvidence.length > 0 ? (
      <section className={`${featureChrome.card} p-5`} aria-label="Workspace work used in this report">
        <h3 className="text-base font-semibold tracking-tight">Workspace work used in this report</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">These saved work items were treated as evidence for experience, skills, and featured sections. They stay in your workspace until you mark them public on your portfolio.</p>
        <ul className="mt-4 space-y-2">
          {result.workEvidence.map((item) => (
            <li key={item.id} className="rounded-xl bg-[#FAF9F6] px-4 py-3 text-sm">
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null}

    {actions.length > 0 && <section className={`${featureChrome.card} p-5`}>
      <h3 className="text-base font-semibold tracking-tight">Start with these fixes</h3>
      <ol className="mt-4 space-y-3">{actions.map(item => <li key={item.id} className="rounded-2xl bg-[#FAF9F6] p-4">
        <p className="text-sm font-semibold">{item.checkpoint}</p>
        <p className="mt-1 text-sm text-neutral-600">{item.fix || "Review and improve this section with specific evidence."}</p>
      </li>)}</ol>
    </section>}

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Category scores">
      {LINKEDIN_AUDIT_CATEGORIES.map(category => <div key={category} className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{labels[category]}</span><strong className="text-sm">{result.scores.categories[category] == null ? "Unknown" : `${result.scores.categories[category]}%`}</strong></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">{result.scores.categories[category] == null ? null : <div className="h-full rounded-full bg-neutral-900" style={{ width: `${result.scores.categories[category]}%` }} />}</div>
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
