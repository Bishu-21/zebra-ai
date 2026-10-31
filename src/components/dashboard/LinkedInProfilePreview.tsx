"use client";

import { featureChrome } from "@/components/dashboard/feature-chrome";
import { buildLinkedInProfilePreview, type LinkedInDraft, type WorkspaceWorkEvidence } from "@/lib/linkedin-workflow";

export function LinkedInProfilePreview({
    name,
    drafts,
    workItems,
}: {
    name?: string;
    drafts: LinkedInDraft[];
    workItems: WorkspaceWorkEvidence[];
}) {
    const preview = buildLinkedInProfilePreview({ drafts, workItems });
    const hasDrafts = Boolean(preview.headline || preview.about || preview.experience);
    const hasWork = preview.workItems.length > 0;

    if (!hasDrafts && !hasWork) {
        return (
            <section className={`${featureChrome.card} p-5`} aria-label="LinkedIn profile preview">
                <p className={featureChrome.helper}>Preview</p>
                <h2 className="mt-1 text-base font-semibold tracking-tight">How this would read on LinkedIn</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Run an audit, then approve drafts. Work you saved in Work appears here as Featured and Experience evidence. Zebra does not post for you.
                </p>
            </section>
        );
    }

    return (
        <section className={`${featureChrome.card} p-5`} aria-label="LinkedIn profile preview">
            <p className={featureChrome.helper}>Preview</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">How this would read on LinkedIn</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Approved drafts replace the current wording. Workspace work is listed as experience and featured proof. Copy the text into LinkedIn yourself.
            </p>
            <article className="mt-5 rounded-2xl border border-neutral-200/80 bg-[#FAF9F6] p-5">
                <p className="text-sm font-semibold text-foreground">{name || "Your name"}</p>
                <p className="mt-1 text-sm text-foreground">{preview.headline || "Headline draft not approved yet"}</p>
                <div className="mt-4">
                    <p className={featureChrome.label}>About</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">
                        {preview.about || "Approve an About draft to preview this section."}
                    </p>
                </div>
                <div className="mt-4">
                    <p className={featureChrome.label}>Experience</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">
                        {preview.experience || "Approve an experience draft, or save work items to show them here."}
                    </p>
                </div>
                {hasWork ? (
                    <div className="mt-4">
                        <p className={featureChrome.label}>Featured work from your workspace</p>
                        <ul className="mt-2 space-y-2">
                            {preview.workItems.map((item) => (
                                <li key={item.id} className="rounded-xl bg-white p-3 text-sm">
                                    <p className="font-medium text-foreground">{item.title}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{item.category}{item.result ? ` · ${item.result}` : ""}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </article>
        </section>
    );
}
