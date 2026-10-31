"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { RiAddLine, RiCloseLine, RiLoader4Line, RiLink, RiFileSearchLine } from "react-icons/ri";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { AppIcon } from "@/components/ui/AppIcon";
import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";

type ResumeOption = { id: string; title: string };

export function AddApplicationDrawer({ resumes, onboarding = false }: { resumes: ResumeOption[]; onboarding?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeOptions, setResumeOptions] = useState<ResumeOption[]>(resumes);
  const [resumeCursor, setResumeCursor] = useState<string | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [form, setForm] = useState({ company: "", position: "", deadline: "", jobDescription: "", selectedResumeId: "" });
  const openedFromZebuRef = useRef(false);
  useEffect(() => {
    if (open && openedFromZebuRef.current) {
      openedFromZebuRef.current = false;
      window.dispatchEvent(new CustomEvent("zebu:application-form-opened"));
    }
  }, [open]);
  const closeDrawer = useCallback(() => { if (!saving) setOpen(false); }, [saving]);
  const dialogRef = useDialogFocus(open, closeDrawer);

  const loadResumes = useCallback(async (cursor?: string) => {
    setLoadingResumes(true);
    try {
      const query = new URLSearchParams({ limit: "50" });
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(`/api/resumes?${query.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load resumes");
      setResumeOptions(current => cursor ? [...current, ...(data.resumes || [])] : (data.resumes || []));
      setResumeCursor(data.page?.nextCursor ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load resumes");
    } finally {
      setLoadingResumes(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void loadResumes(); });
    return () => { cancelled = true; };
  }, [loadResumes, open]);

  useEffect(() => {
    const openFromZebu = () => {
      sessionStorage.removeItem("zebu:pending-event");
      if (open) {
        window.dispatchEvent(new CustomEvent("zebu:application-form-opened"));
      } else {
        openedFromZebuRef.current = true;
        setOpen(true);
      }
    };
    window.addEventListener("zebu:add-application", openFromZebu);
    if (sessionStorage.getItem("zebu:pending-event") === "add_application") openFromZebu();
    return () => window.removeEventListener("zebu:add-application", openFromZebu);
  }, [open]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const extract = async () => {
    if (!jobUrl.trim()) return;
    setExtracting(true); setError(null);
    try {
      const response = await fetch("/api/jobs/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: jobUrl.trim() }) });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const hint = typeof data.suggestion === "string" ? ` ${data.suggestion}` : " Paste the job description below and continue.";
        throw new Error(`${data.error || data.details || "Could not extract this listing."}${hint}`);
      }
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
      if (onboarding && data.application?.id) {
        router.push(`/dashboard/applications/${encodeURIComponent(data.application.id)}?step=resume`);
      } else {
        router.refresh();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not add the application."); }
    finally { setSaving(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${featureChrome.primaryButton} w-full md:w-auto`}><AppIcon icon={RiAddLine} size={15} /> {onboarding ? "Start an application" : "Add application"}</button>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[120] flex justify-end">
            <m.button aria-label="Close drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="absolute inset-0 bg-black/40" />
            <m.aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-application-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.24, ease: "easeOut" }} className="relative flex h-full w-full max-w-lg flex-col border-l border-neutral-200/70 bg-white font-sans">
              <header className={featureChrome.dialogHeader}>
                <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                  <FeatureIcon feature="Applications" size={18} className="text-muted-foreground" />
                  <div className="min-w-0">
                    <h2 id="add-application-title" className="text-base font-semibold tracking-tight">{onboarding ? "Add your target job" : "Add application"}</h2>
                    <p className={featureChrome.helper}>{onboarding ? "Paste a job link or enter the role. Next, attach a resume in your application workspace." : "Start with a listing URL or enter the details manually."}</p>
                  </div>
                </div>
                <button type="button" aria-label="Close add application" onClick={closeDrawer} className={featureChrome.iconButton}><AppIcon icon={RiCloseLine} size={18} /></button>
              </header>
              <div className={`${featureChrome.dialogBody} space-y-5`}>
                <div className="space-y-1.5">
                  <label htmlFor="application-job-url" className={featureChrome.label}>Job URL</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <AppIcon icon={RiLink} className={`${featureChrome.fieldIcon} pointer-events-none`} />
                      <input id="application-job-url" type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://company.com/jobs/..." className={`${featureChrome.input} pl-10`} />
                    </div>
                    <button type="button" aria-label="Extract job details from URL" onClick={extract} disabled={!jobUrl.trim() || extracting} className={featureChrome.primaryButton}>{extracting ? <AppIcon icon={RiLoader4Line} className="animate-spin" /> : <AppIcon icon={RiFileSearchLine} />} Extract</button>
                  </div>
                </div>
                <p className={featureChrome.helper}>Extract is optional. Many job sites block automatic import. Paste the description below and you can still save the application.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company *" value={form.company} onChange={(value) => update("company", value)} placeholder="Company name" />
                  <Field label="Position / role *" value={form.position} onChange={(value) => update("position", value)} placeholder="Target role" />
                </div>
                <Field label="Deadline (optional)" value={form.deadline} onChange={(value) => update("deadline", value)} type="date" />
                <label className="block"><span className={featureChrome.label}>Job description (optional)</span><textarea rows={8} value={form.jobDescription} onChange={(event) => update("jobDescription", event.target.value)} placeholder="Paste the job description" className={`mt-1.5 ${featureChrome.textarea}`} /></label>
                <label className="block"><span className={featureChrome.label}>Attach resume</span><select value={form.selectedResumeId} onChange={(event) => update("selectedResumeId", event.target.value)} className={`mt-1.5 ${featureChrome.select}`}><option value="">Select later</option>{resumeOptions.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></label>
                {resumeCursor ? <button type="button" disabled={loadingResumes} onClick={() => void loadResumes(resumeCursor)} className="text-sm font-medium text-muted-foreground underline disabled:opacity-50">{loadingResumes ? "Loading resumes…" : "Load more resumes"}</button> : null}
                {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              </div>
              <footer className={featureChrome.dialogFooter}>
                <button onClick={() => setOpen(false)} disabled={saving} className={featureChrome.ghostButton}>Cancel</button>
                <button onClick={submit} disabled={saving} className={featureChrome.primaryButton}>{saving ? <AppIcon icon={RiLoader4Line} className="animate-spin" /> : <AppIcon icon={RiAddLine} />} {onboarding ? "Continue to resume" : "Add application"}</button>
              </footer>
            </m.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className={featureChrome.label}>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`mt-1.5 ${featureChrome.input}`} /></label>;
}
