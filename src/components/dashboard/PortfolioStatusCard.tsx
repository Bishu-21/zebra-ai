"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RiAddLine, RiExternalLinkLine, RiLoader4Line, RiRefreshLine } from "react-icons/ri";

type PortfolioStatusCardProps = {
    slug: string;
    title: string;
    selectedWorkIds: string[];
    isPublished: boolean;
};

export function PortfolioStatusCard({ slug, title, selectedWorkIds, isPublished }: PortfolioStatusCardProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [receipt, setReceipt] = useState<{ published: boolean; message: string; canUndo: boolean } | null>(null);
    const publicUrl = `/p/${slug}`;

    const setPublished = async (published: boolean) => {
        setSaving(true);
        setReceipt(null);
        try {
            const response = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, title, selectedWorkIds, isPublished: published, theme: "default" }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Could not update the portfolio.");
            setReceipt({ published, message: published ? "Portfolio published." : "Portfolio unpublished.", canUndo: true });
            router.refresh();
        } catch (error) {
            setReceipt({ published: isPublished, message: error instanceof Error ? error.message : "Could not update the portfolio.", canUndo: false });
        } finally {
            setSaving(false);
        }
    };

    if (selectedWorkIds.length === 0) {
        return (
            <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
                <p className="text-sm font-bold">Add something before publishing</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">Your public link stays hidden until your portfolio contains at least one work item.</p>
                <Link href="/dashboard/work" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0A0A0A] px-4 py-2.5 text-xs font-bold text-white"><RiAddLine /> Add your first work item</Link>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-neutral-800 bg-[#0A0A0A] p-6 text-white shadow-sm" aria-live="polite">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div>
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/50">{isPublished ? "Published portfolio" : "Portfolio draft"}</p>
                    <h2 className="mt-1 text-base font-bold">{isPublished ? `zebra-ai.app${publicUrl}` : "Ready when you are"}</h2>
                    <p className="mt-1 text-xs text-white/55">{isPublished ? "Your selected work is visible through this link." : `${selectedWorkIds.length} work ${selectedWorkIds.length === 1 ? "item is" : "items are"} ready to publish.`}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isPublished ? <Link href={publicUrl} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black">View portfolio <RiExternalLinkLine /></Link> : null}
                    <button type="button" disabled={saving} onClick={() => void setPublished(!isPublished)} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50 ${isPublished ? "border border-white/20 text-white" : "bg-white text-black"}`}>
                        {saving ? <RiLoader4Line className="animate-spin" /> : null}{isPublished ? "Unpublish" : "Publish portfolio"}
                    </button>
                </div>
            </div>
            {receipt ? (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
                    <span>{receipt.message}</span>
                    {receipt.canUndo ? <button type="button" onClick={() => void setPublished(!receipt.published)} className="inline-flex items-center gap-1 font-bold"><RiRefreshLine /> Undo</button> : null}
                </div>
            ) : null}
        </section>
    );
}
