"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { RiAddLine, RiArrowRightLine, RiCloseLine, RiLoader4Line, RiLink } from "react-icons/ri";
import { useDialogFocus } from "@/hooks/useDialogFocus";

type ResumeOption = { id: string; title: string };

export function AddApplicationDrawer({ resumes }: { resumes: ResumeOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [form, setForm] = useState({ company: "", position: "", deadline: "", jobDescription: "", selectedResumeId: "" });
  const closeDrawer = useCallback(() => { if (!saving) setOpen(false); }, [saving]);
  const dialogRef = useDialogFocus(open, closeDrawer);

  useEffect(() => {
    const openFromZebu = () => {
      sessionStorage.removeItem("zebu:pending-event");
      setOpen(true);
    };
    window.addEventListener("zebu:add-application", openFromZebu);
    if (sessionStorage.getItem("zebu:pending-event") === "add_application") openFromZebu();
    return () => window.removeEventListener("zebu:add-application", openFromZebu);
  }, []);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const extract = async () => {
    if (!jobUrl.trim()) return;
    setExtracting(true); setError(null);
    try {
      const response = await fetch("/api/jobs/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: jobUrl.trim() }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.details || "Could not extract this listing.");
      setForm((current) => ({ ...current, company: data.company || current.company, position: data.position || current.position, jobDescription: data.description || current.jobDescription }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not extract this listing."); }
    finally { setExtracting(false); }
  };

  const submit = async () => {
    if (!form.company.trim() || !form.position.trim()) { setError("Company and position are required."); return; }
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: form.company.trim(), position: form.position.trim(), status: "Draft", url: jobUrl.trim(), deadline: form.deadline || undefined, jobDescription: form.jobDescription.trim(), selectedResumeId: form.selectedResumeId || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add the application.");
      setOpen(false); setJobUrl(""); setForm({ company: "", position: "", deadline: "", jobDescription: "", selectedResumeId: "" });
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add the application."); }
    finally { setSaving(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-sm)] transition hover:bg-secondary md:w-auto"><RiAddLine size={15} /> Add application</button>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[120] flex justify-end">
            <m.button aria-label="Close drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
            <m.aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-application-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.24, ease: "easeOut" }} className="relative flex h-full w-full max-w-lg flex-col border-l border-border-subtle bg-background shadow-[var(--shadow-2xl)]">
              <header className="flex items-center justify-between border-b border-border-subtle px-6 py-5"><div><h2 id="add-application-title" className="text-lg font-bold">Add application</h2><p className="mt-1 text-xs text-muted-foreground">Start with a listing URL or enter the details manually.</p></div><button type="button" aria-label="Close add application" onClick={closeDrawer} className="rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground"><RiCloseLine size={18} /></button></header>
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-muted/40 p-4">
                  <label className="text-xs font-bold text-foreground">Paste job URL</label>
                  <div className="mt-2 flex gap-2"><div className="relative flex-1"><RiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://company.com/jobs/..." className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-white py-3 pl-9 pr-3 text-xs outline-none focus:border-neutral-300" /></div><button onClick={extract} disabled={!jobUrl.trim() || extracting} className="rounded-[var(--radius-md)] bg-foreground px-4 text-xs font-bold text-white disabled:opacity-40">{extracting ? <RiLoader4Line className="animate-spin" /> : <RiArrowRightLine />}</button></div>
                </div>
                <div className="flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"><span className="h-px flex-1 bg-border-subtle" />or fill manually<span className="h-px flex-1 bg-border-subtle" /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company *" value={form.company} onChange={(value) => update("company", value)} placeholder="Company name" />
                  <Field label="Position / role *" value={form.position} onChange={(value) => update("position", value)} placeholder="Target role" />
                </div>
                <Field label="Deadline (optional)" value={form.deadline} onChange={(value) => update("deadline", value)} type="date" />
                <label className="block"><span className="text-xs font-bold">Job description (optional)</span><textarea rows={8} value={form.jobDescription} onChange={(event) => update("jobDescription", event.target.value)} placeholder="Paste the job description" className="mt-2 w-full resize-y rounded-[var(--radius-md)] border border-border-subtle bg-white px-3.5 py-3 text-xs leading-5 outline-none focus:border-neutral-300" /></label>
                <label className="block"><span className="text-xs font-bold">Attach resume</span><select value={form.selectedResumeId} onChange={(event) => update("selectedResumeId", event.target.value)} className="mt-2 w-full rounded-[var(--radius-md)] border border-border-subtle bg-white px-3.5 py-3 text-xs font-medium outline-none"><option value="">Select later</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></label>
                {error ? <p role="alert" className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{error}</p> : null}
              </div>
              <footer className="grid grid-cols-2 gap-3 border-t border-border-subtle bg-white p-6"><button onClick={() => setOpen(false)} disabled={saving} className="rounded-full border border-border-subtle px-5 py-3 text-xs font-bold text-muted-foreground hover:bg-muted">Cancel</button><button onClick={submit} disabled={saving} className="flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-white disabled:opacity-50">{saving ? <RiLoader4Line className="animate-spin" /> : <RiAddLine />} Add application</button></footer>
            </m.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className="text-xs font-bold">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-[var(--radius-md)] border border-border-subtle bg-white px-3.5 py-3 text-xs font-medium outline-none focus:border-neutral-300" /></label>;
}
