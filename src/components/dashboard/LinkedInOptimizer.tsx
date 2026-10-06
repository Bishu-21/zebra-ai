"use client";

import { useState, type FormEvent } from "react";
import { LinkedInAuditResults, type LinkedInAuditResult } from "./LinkedInAuditResults";
import { LinkedInSeoChecklist } from "./LinkedInSeoChecklist";
import { LinkedInDraftReview } from "./LinkedInDraftReview";
import { validateLinkedInProfileUrl, type LinkedInDraft } from "@/lib/linkedin-workflow";

export function LinkedInOptimizer({ initialResult, initialAuditId, initialDrafts, initialUrl, initialTargetRole }: {
  initialResult?: LinkedInAuditResult | null;
  initialAuditId?: string | null;
  initialDrafts?: LinkedInDraft[] | null;
  initialUrl?: string | null;
  initialTargetRole?: string | null;
}) {
  const [profileText, setProfileText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(initialUrl || "");
  const [targetRole, setTargetRole] = useState(initialTargetRole || "");
  const [result, setResult] = useState<LinkedInAuditResult | null>(initialResult || null);
  const [auditId, setAuditId] = useState<string | null>(initialAuditId || null);
  const [drafts, setDrafts] = useState<LinkedInDraft[] | null>(initialDrafts || null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const profileUrlValid = validateLinkedInProfileUrl(linkedinUrl) !== null;

  async function readExport(file: File | undefined) {
    if (!file) return;
    setExtracting(true);
    setError("");
    try {
      if (!/\.(pdf|txt)$/i.test(file.name) || file.size > 5 * 1024 * 1024) throw new Error("Choose a PDF or TXT export under 5 MB.");
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/ai/linkedin-audit/extract", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read the export.");
      setProfileText(data.profileText);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read the export."); }
    finally { setExtracting(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai/linkedin-audit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText, linkedinUrl: linkedinUrl || undefined, targetRole: targetRole || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The audit could not be completed.");
      setResult(data.analysis);
      setAuditId(data.auditId);
      setDrafts(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The audit could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function createDrafts() {
    if (!auditId || drafting) return;
    setDrafting(true);
    setError("");
    try {
      const response = await fetch(`/api/ai/linkedin-audit/${auditId}/drafts`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create profile drafts.");
      setDrafts(data.drafts);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create profile drafts."); }
    finally { setDrafting(false); }
  }

  return <div className="space-y-8 px-5 py-8 sm:px-8">
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Career presence</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">Make your LinkedIn profile work harder</h1>
      <p className="mt-3 text-sm leading-6 text-neutral-600">Bring your profile evidence, choose a target role, then review specific edits grounded in your own words. Your LinkedIn URL identifies the profile; Zebra does not scrape it or post changes to your account.</p>
    </header>

    <nav aria-label="Optimization steps" className="grid gap-3 text-sm sm:grid-cols-3">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4"><strong>1. Add evidence</strong><p className="mt-1 text-neutral-500">Paste or import your profile</p></div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4"><strong>2. Audit</strong><p className="mt-1 text-neutral-500">See evidence-backed priorities</p></div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4"><strong>3. Review drafts</strong><p className="mt-1 text-neutral-500">Approve, edit, and copy</p></div>
    </nav>

    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Step 1 · Source and goal</p><h2 className="mt-2 text-xl font-semibold">What profile are we improving?</h2></div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium">Target role or service
          <input required value={targetRole} onChange={event => setTargetRole(event.target.value)} minLength={3} maxLength={120} placeholder="e.g. Frontend developer" className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900" />
        </label>
        <label className="block text-sm font-medium">LinkedIn profile URL
          <input required type="url" value={linkedinUrl} onChange={event => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/your-name/" aria-invalid={linkedinUrl.length > 0 && !profileUrlValid} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900" />
          {linkedinUrl.length > 0 && !profileUrlValid && <span className="mt-1 block text-xs text-rose-700">Use a profile URL beginning with https://www.linkedin.com/in/</span>}
        </label>
      </div>
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-[#FAF9F6] p-4">
        <label className="block text-sm font-medium">Import your LinkedIn export <span className="font-normal text-neutral-500">(PDF or TXT, up to 5 MB)</span>
          <input type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={event => readExport(event.target.files?.[0])} className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium" />
        </label>
        <p className="mt-2 text-xs text-neutral-500">On LinkedIn desktop, use More or Resources → Save to PDF if available. Check the extracted text before auditing.</p>
        {extracting && <p role="status" className="mt-2 text-sm">Reading export…</p>}
      </div>
      <label className="block text-sm font-medium">Profile text
        <textarea required minLength={100} maxLength={30000} value={profileText} onChange={event => setProfileText(event.target.value)} rows={12} placeholder="Paste your headline, About, Experience, Skills, Education, and Featured sections. Include section labels so the audit can tell what is missing." className="mt-2 w-full resize-y rounded-xl border border-neutral-300 px-4 py-3 leading-6 outline-none focus:border-neutral-900" />
      </label>
      <p className="text-xs text-neutral-500">{profileText.length.toLocaleString()} / 30,000 characters. Your source text is stored privately so proposals can be checked against it.</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">Visual, network, and account-only checks remain unassessed until you verify them.</p>
        <button disabled={busy || extracting || profileText.trim().length < 100 || !profileUrlValid || targetRole.trim().length < 3} className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Auditing…" : "Run 45-check audit · 1 credit"}</button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </form>

    {result && <div className="space-y-5">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Step 2 · Audit</p>
        <p className="mt-2 text-sm text-neutral-600">Review what the evidence supports, then ask the agent for editable profile text.</p>
      </div>
      <LinkedInAuditResults result={result} />
      {auditId && !drafts && <div className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Turn the findings into profile edits</h2>
        <p className="mt-2 text-sm text-neutral-600">The agent will propose evidence-linked headline, About, and experience rewrites. One draft generation costs one credit; no credit is charged again when reopening saved drafts.</p>
        <button type="button" disabled={drafting} onClick={createDrafts} className="mt-4 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{drafting ? "Drafting…" : "Create reviewable drafts · 1 credit"}</button>
      </div>}
    </div>}
    {auditId && drafts && <LinkedInDraftReview auditId={auditId} drafts={drafts} onChange={setDrafts} />}
    <LinkedInSeoChecklist />
  </div>;
}
