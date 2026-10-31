"use client";

import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { LinkedInAuditResults, type LinkedInAuditResult } from "./LinkedInAuditResults";
import { LinkedInSeoChecklist } from "./LinkedInSeoChecklist";
import { LinkedInDraftReview } from "./LinkedInDraftReview";
import { validateLinkedInProfileUrl, type LinkedInDraft } from "@/lib/linkedin-workflow";

export function LinkedInOptimizer({ initialResult, initialAuditId, initialDrafts, initialUrl, initialTargetRole, children }: {
  initialResult?: LinkedInAuditResult | null;
  initialAuditId?: string | null;
  initialDrafts?: LinkedInDraft[] | null;
  initialUrl?: string | null;
  initialTargetRole?: string | null;
  children?: ReactNode;
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
  const requestPending = useRef(false);
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
    if (requestPending.current) return;
    requestPending.current = true;
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
      requestPending.current = false;
      setBusy(false);
    }
  }

  async function createDrafts() {
    if (!auditId || requestPending.current) return;
    requestPending.current = true;
    setDrafting(true);
    setError("");
    try {
      const response = await fetch(`/api/ai/linkedin-audit/${auditId}/drafts`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create profile drafts.");
      setDrafts(data.drafts);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create profile drafts."); }
    finally { requestPending.current = false; setDrafting(false); }
  }

  return <DashboardPage>
    <DashboardPageHeader
      title="LinkedIn review"
      description="Paste or import a LinkedIn PDF/TXT export, then review suggested wording. Zebra does not log in to LinkedIn, scrape your profile, or post for you. Copy drafts and publish them on LinkedIn yourself."
    />

    <nav aria-label="Optimization steps" className="grid gap-3 text-sm sm:grid-cols-3">
      <div className={featureChrome.card}><strong className="font-semibold">1. Add evidence</strong><p className="mt-1 text-sm text-muted-foreground">Paste or import your profile</p></div>
      <div className={featureChrome.card}><strong className="font-semibold">2. Audit</strong><p className="mt-1 text-sm text-muted-foreground">See evidence-backed priorities</p></div>
      <div className={featureChrome.card}><strong className="font-semibold">3. Review drafts</strong><p className="mt-1 text-sm text-muted-foreground">Approve, edit, and copy</p></div>
    </nav>

    <form onSubmit={submit} className={`${featureChrome.card} space-y-5 p-5`}>
      <div><p className={featureChrome.helper}>Step 1 · Source and goal</p><h2 className="mt-1 text-base font-semibold tracking-tight">What profile are we improving?</h2></div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block text-sm font-medium">Target role or service
          <input required value={targetRole} onChange={event => setTargetRole(event.target.value)} minLength={3} maxLength={120} placeholder="e.g. Frontend developer" className={`mt-2 ${featureChrome.input}`} />
        </label>
        <label className="block text-sm font-medium">LinkedIn profile URL
          <input required type="url" value={linkedinUrl} onChange={event => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/your-name/" aria-invalid={linkedinUrl.length > 0 && !profileUrlValid} className={`mt-2 ${featureChrome.input}`} />
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
        <textarea required minLength={100} maxLength={30000} value={profileText} onChange={event => setProfileText(event.target.value)} rows={12} placeholder="Paste your headline, About, Experience, Skills, Education, and Featured sections. Include section labels so the audit can tell what is missing." className={`mt-2 ${featureChrome.textarea}`} />
      </label>
      <p className="text-xs text-neutral-500">{profileText.length.toLocaleString()} / 30,000 characters. Your source text is stored privately so proposals can be checked against it.</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">Visual, network, and account-only checks remain unassessed until you verify them.</p>
        <button disabled={busy || drafting || extracting || profileText.trim().length < 100 || !profileUrlValid || targetRole.trim().length < 3} className={featureChrome.primaryButton}>{busy ? "Auditing…" : "Run 45-check audit · 1 credit"}</button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </form>

    {result && <div className="space-y-5">
      <div className={`${featureChrome.card} p-5`}>
        <p className={featureChrome.helper}>Step 2 · Audit</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Review what the evidence supports, then generate editable profile text you can copy.</p>
      </div>
      <LinkedInAuditResults result={result} />
      {auditId && !drafts && <div className={`${featureChrome.card} p-5`}>
        <h2 className="text-base font-semibold tracking-tight">Turn the findings into profile edits</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This creates headline, About, and experience drafts from your pasted text. One draft generation costs one credit. Reopening saved drafts does not charge again. You still copy the text into LinkedIn.</p>
        <button type="button" disabled={busy || drafting} onClick={createDrafts} className={`${featureChrome.primaryButton} mt-4`}>{drafting ? "Drafting…" : "Create reviewable drafts · 1 credit"}</button>
      </div>}
    </div>}
    {auditId && drafts && <LinkedInDraftReview auditId={auditId} drafts={drafts} onChange={setDrafts} />}
    <LinkedInSeoChecklist />
    {children}
  </DashboardPage>;
}
