"use client";

import { useState } from "react";

const checks = [
  "My public profile visibility matches my job search goals",
  "My resume and LinkedIn use the same target role and core skills",
  "My portfolio or GitHub links to LinkedIn, and my profile links back to my work",
  "My Featured section points to work that supports my claims",
  "I review Search Appearances and profile views for useful trends",
];

export function LinkedInSeoChecklist() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold">Connected profile checklist</h2>
    <p className="mt-2 text-sm text-neutral-600">Check these on your own accounts. Zebra cannot verify external sites from a pasted profile.</p>
    <div className="mt-4 space-y-3">{checks.map((label, index) => <label key={label} className="flex cursor-pointer items-start gap-3 text-sm text-neutral-800">
      <input type="checkbox" checked={Boolean(checked[index])} onChange={event => setChecked(prev => ({ ...prev, [index]: event.target.checked }))} className="mt-1 accent-neutral-900" />
      <span>{label}</span>
    </label>)}</div>
  </section>;
}
