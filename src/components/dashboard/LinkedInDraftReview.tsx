"use client";

import { useState } from "react";
import type { LinkedInDraft } from "@/lib/linkedin-workflow";

const fieldLabel: Record<LinkedInDraft["field"], string> = { headline: "Headline", about: "About", experience: "Experience" };

export function LinkedInDraftReview({ auditId, drafts, onChange }: { auditId: string; drafts: LinkedInDraft[]; onChange: (drafts: LinkedInDraft[]) => void }) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function decide(draft: LinkedInDraft, status: "accepted" | "dismissed") {
    setSaving(draft.id);
    setError("");
    try {
      const response = await fetch(`/api/ai/linkedin-audit/${auditId}/drafts`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, status, editedText: status === "accepted" ? edits[draft.id] || draft.editedText || draft.proposedText : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your review.");
      onChange(data.drafts);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save your review."); }
    finally { setSaving(null); }
  }

  async function copy(draft: LinkedInDraft) {
    const text = draft.editedText || draft.proposedText;
    try { await navigator.clipboard.writeText(text); setCopied(draft.id); }
    catch { setError("Clipboard unavailable. Select and copy the text manually."); }
  }

  return <section className="space-y-4" aria-label="Suggested profile edits">
    <div className="rounded-3xl bg-neutral-950 p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-300">Step 3 · Review</p>
      <h2 className="mt-2 text-2xl font-semibold">Your profile rewrite workspace</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">Each draft shows the exact phrase it uses as evidence. Edit or dismiss anything that does not reflect your real work. Accepted text is ready to copy; Zebra does not post to LinkedIn for you.</p>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {drafts.map(draft => <article key={draft.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{fieldLabel[draft.field]}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${draft.status === "accepted" ? "bg-emerald-50 text-emerald-800" : draft.status === "dismissed" ? "bg-neutral-100 text-neutral-600" : "bg-amber-50 text-amber-800"}`}>{draft.status}</span>
      </div>
      <div className="mt-4 rounded-2xl bg-[#FAF9F6] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Evidence from your profile</p>
        <blockquote className="mt-2 border-l-2 border-neutral-300 pl-3 text-sm leading-6 text-neutral-700">{draft.sourceQuote}</blockquote>
      </div>
      <label className="mt-4 block text-sm font-medium">Proposed text
        <textarea value={edits[draft.id] ?? draft.editedText ?? draft.proposedText} onChange={event => setEdits(previous => ({ ...previous, [draft.id]: event.target.value }))} rows={draft.field === "headline" ? 3 : 6} maxLength={3000} className="mt-2 w-full resize-y rounded-xl border border-neutral-300 p-3 font-normal leading-6 outline-none focus:border-neutral-900" />
      </label>
      <p className="mt-2 text-xs text-neutral-500">Why this helps: {draft.rationale}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={saving === draft.id} onClick={() => decide(draft, "accepted")} className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving === draft.id ? "Saving…" : "Approve draft"}</button>
        <button type="button" disabled={saving === draft.id} onClick={() => decide(draft, "dismissed")} className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium disabled:opacity-50">Dismiss</button>
        {draft.status === "accepted" && <button type="button" onClick={() => copy(draft)} className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium">{copied === draft.id ? "Copied" : "Copy approved text"}</button>}
      </div>
    </article>)}
    <p className="text-xs leading-5 text-neutral-500">Before publishing, check names, dates, skills, and outcomes against your own records. Automated checks block unsupported numbers and links, but human review remains required for every claim.</p>
  </section>;
}
