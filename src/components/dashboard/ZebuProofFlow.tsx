"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type WorkOption = { id: string; title: string; proofUrl?: string | null };
type Proposal = { title: string; description: string | null; proofUrl: string; createsWorkItem: boolean };
type Draft = { workItemId: string; title: string; description: string; proofUrl: string };
const storageKey = "zebu:portfolio-proof-draft";
const emptyDraft: Draft = { workItemId: "", title: "", description: "", proofUrl: "" };

export function ZebuProofFlow({ onVerified, onCancel }: { onVerified: (item: { id: string; title: string; proofUrl: string }) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [items, setItems] = useState<WorkOption[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const restored = { ...emptyDraft, ...JSON.parse(saved) as Partial<Draft> };
        queueMicrotask(() => { if (!cancelled) setDraft(restored); });
      }
    } catch { /* Ignore an invalid local draft. */ }
    return () => { cancelled = true; };
  }, []);

  const loadItems = useCallback(async (next?: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: "50" });
      if (next) query.set("cursor", next);
      const response = await fetch(`/api/work?${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your work items.");
      setItems((previous) => next ? [...previous, ...(data.items ?? [])] : data.items ?? []);
      setCursor(data.page?.nextCursor ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your work items.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void loadItems(); });
    return () => { cancelled = true; };
  }, [loadItems]);

  const update = (key: keyof Draft, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next); setError(null); setToken(null); setProposal(null);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Draft remains in memory. */ }
  };

  const request = async (body: unknown) => {
    const response = await fetch("/api/zebu/portfolio-proof", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "This proof step could not be completed.");
    return data;
  };

  const prepare = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const payload = draft.workItemId
        ? { workItemId: draft.workItemId, proofUrl: draft.proofUrl.trim() }
        : { title: draft.title.trim(), description: draft.description.trim(), proofUrl: draft.proofUrl.trim() };
      const data = await request({ mode: "prepare", draft: payload });
      setProposal(data.proposal); setToken(data.token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not prepare this change."); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!token) return;
    setBusy(true); setError(null);
    try {
      const data = await request({ mode: "confirm", token });
      if (!data.verified || !data.item?.proofUrl) throw new Error("The saved proof could not be verified.");
      try { sessionStorage.removeItem(storageKey); } catch { /* The verified result is still available. */ }
      onVerified(data.item);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this proof."); }
    finally { setBusy(false); }
  };

  return <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm shadow-sm" aria-label="Add portfolio proof">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">Add proof to your work</h3><p className="mt-1 text-xs text-neutral-600">Zebu will show the change before saving it. Your work stays private.</p></div><button type="button" onClick={onCancel} className="text-xs font-semibold text-neutral-600">Close</button></div>
    {!proposal ? <form onSubmit={prepare} className="mt-4 grid gap-3">
      <label className="grid gap-1 text-xs font-semibold">Work item
        <select value={draft.workItemId} onChange={(event) => update("workItemId", event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
          <option value="">Create a new project</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      {loading ? <p className="text-xs text-neutral-500">Checking your saved work…</p> : items.length === 0 ? <p className="text-xs text-neutral-600">You have no work items yet. Tell Zebu about your first project below.</p> : null}
      {cursor ? <button type="button" onClick={() => void loadItems(cursor)} disabled={loading} className="text-left text-xs font-semibold underline">Load older work items</button> : null}
      {!draft.workItemId ? <><label className="grid gap-1 text-xs font-semibold">Project title<input required minLength={2} maxLength={200} value={draft.title} onChange={(event) => update("title", event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="What did you build?" /></label>
        <label className="grid gap-1 text-xs font-semibold">What you did (optional)<textarea maxLength={2000} value={draft.description} onChange={(event) => update("description", event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" rows={2} placeholder="Use your own words; Zebu will not invent results." /></label></> : null}
      <label className="grid gap-1 text-xs font-semibold">Public proof link<input required type="url" value={draft.proofUrl} onChange={(event) => update("proofUrl", event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" placeholder="https://github.com/you/project" /></label>
      <p className="text-xs text-neutral-500">A GitHub repository, demo, presentation, or public document works. File uploads are not in this step yet.</p>
      <button type="submit" disabled={busy} className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Checking…" : "Review change"}</button>
    </form> : <div className="mt-4 grid gap-3">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs"><p className="font-bold">{proposal.createsWorkItem ? "Create private project" : "Update existing work item"}: {proposal.title}</p>{proposal.description ? <p className="mt-1 text-neutral-600">{proposal.description}</p> : null}<p className="mt-2 break-all text-neutral-700">Proof: {proposal.proofUrl}</p></div>
      <p className="text-xs text-neutral-600">Confirm this exact change. Zebu will verify the saved record before reporting completion.</p>
      <div className="flex gap-2"><button type="button" onClick={() => { setProposal(null); setToken(null); }} disabled={busy} className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-bold">Edit</button><button type="button" onClick={() => void confirm()} disabled={busy} className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Confirm and save"}</button></div>
    </div>}
    {error ? <p role="alert" className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}
  </section>;
}
