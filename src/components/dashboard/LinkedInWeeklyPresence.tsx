"use client";

import { useState, useSyncExternalStore } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { RiLink } from "react-icons/ri";

type Proof = { id: string; project: string; skill: string; action: string; outcome: string | null; url: string | null };
type Activity = { kind: "post" | "comment"; at: string; url: string };

export function LinkedInWeeklyPresence({ userId, proofs }: { userId: string; proofs: Proof[] }) {
  const hydrated = useHydrated();
  const key = `zebra-linkedin-presence:${userId}`;
  const rawActivities = useSyncExternalStore(
    (notify) => { window.addEventListener("storage", notify); window.addEventListener("zebra-linkedin-activity", notify); return () => { window.removeEventListener("storage", notify); window.removeEventListener("zebra-linkedin-activity", notify); }; },
    () => localStorage.getItem(key) || "[]",
    () => "[]",
  );
  let activities: Activity[] = [];
  try {
    const parsed: unknown = JSON.parse(rawActivities);
    if (Array.isArray(parsed)) activities = parsed.filter((item): item is Activity =>
      item && (item.kind === "post" || item.kind === "comment") && typeof item.at === "string" && typeof item.url === "string");
  } catch { /* Ignore invalid browser data. */ }
  const [selectedId, setSelectedId] = useState(proofs[0]?.id || "");
  const [activityUrl, setActivityUrl] = useState("");
  const [error, setError] = useState("");

  // Keep SSR and the first browser render identical; use the browser's clock and
  // locale only after hydration because they can differ from the server's.
  const now = hydrated ? new Date() : null;
  const start = now ? new Date(now) : null;
  if (start && now) {
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
  }
  const thisWeek = start ? activities.filter(item => new Date(item.at) >= start) : [];
  const postCount = thisWeek.filter(item => item.kind === "post").length;
  const commentCount = thisWeek.filter(item => item.kind === "comment").length;
  const proof = proofs.find(item => item.id === selectedId) || proofs[0];
  const claim = proof ? `${proof.action}${proof.outcome ? ` The result: ${proof.outcome}` : ""}` : "";
  const postIdea = proof ? `A lesson from ${proof.project}: ${claim}\n\nWhat I learned about ${proof.skill}: [add your own reflection]${proof.url ? `\n\nProof: ${proof.url}` : ""}` : "Add a work example in your portfolio to get a grounded post idea.";
  const commentAngle = proof ? `On a relevant ${proof.skill} discussion, share what you learned while working on ${proof.project}. Use your own words and refer to this proof: ${proof.url || claim}` : "Find a relevant discussion and add one specific insight from your own work.";

  function record(kind: Activity["kind"]) {
    try {
      const url = new URL(activityUrl.trim());
      if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(url.hostname)) throw new Error();
      const next = [{ kind, at: new Date().toISOString(), url: url.toString() }, ...activities].slice(0, 100);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event("zebra-linkedin-activity"));
      setActivityUrl("");
      setError("");
    } catch { setError("Paste the LinkedIn URL of the post or comment you completed."); }
  }

  return <section className={`${featureChrome.card} p-5`} aria-label="Weekly LinkedIn presence">
    <p className={featureChrome.helper}>Weekly presence</p>
    <h2 className="mt-1 text-base font-semibold tracking-tight">One post and one comment each week</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Week of {start ? start.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "…"}. Confirm the published links here; this browser stores them locally.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-neutral-200/70 bg-muted/40 p-4"><strong className="text-sm font-semibold">{postCount} posts</strong><p className={`mt-1 ${featureChrome.helper}`}>{postCount ? "Weekly goal reached" : "No post confirmed this week"}</p></div>
      <div className="rounded-xl border border-neutral-200/70 bg-muted/40 p-4"><strong className="text-sm font-semibold">{commentCount} comments</strong><p className={`mt-1 ${featureChrome.helper}`}>{commentCount ? "Weekly goal reached" : "No comment confirmed this week"}</p></div>
    </div>
    {proofs.length > 0 && <label className={`mt-5 block ${featureChrome.label}`}>Work example
      <select value={selectedId} onChange={event => setSelectedId(event.target.value)} className={`mt-2 ${featureChrome.select}`}>
        {proofs.map(item => <option key={item.id} value={item.id}>{item.project} · {item.skill}</option>)}
      </select>
    </label>}
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-neutral-200/70 p-4"><h3 className="text-sm font-semibold">Post starting point</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{postIdea}</p><a href="https://www.linkedin.com/dashboard/share/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium underline">Start a post</a></div>
      <div className="rounded-xl border border-neutral-200/70 p-4"><h3 className="text-sm font-semibold">Comment angle</h3><p className="mt-2 text-sm leading-6 text-foreground">{commentAngle}</p><a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium underline">Open feed</a></div>
    </div>
    <div className="mt-5">
      <label htmlFor="linkedin-activity-url" className={featureChrome.label}>Completed activity URL</label>
      <div className="relative mt-2">
        <AppIcon icon={RiLink} className={featureChrome.fieldIcon} />
        <input id="linkedin-activity-url" type="url" value={activityUrl} onChange={event => setActivityUrl(event.target.value)} placeholder="https://www.linkedin.com/..." className={`${featureChrome.input} pl-10`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => record("post")} className={featureChrome.primaryButton}>Record post</button>
        <button type="button" onClick={() => record("comment")} className={featureChrome.secondaryButton}>Record comment</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  </section>;
}
