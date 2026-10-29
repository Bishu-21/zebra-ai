"use client";

import { FeatureIcon } from "@/components/dashboard/FeatureIcon";
import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiAddLine,
    RiFolder2Line,
    RiAwardLine,
    RiBriefcase4Line,
    RiLink,
    RiDeleteBinLine,
    RiMagicLine,
    RiCheckboxCircleLine,
    RiLockLine,
    RiGlobalLine,
    RiSearchLine,
    RiBookOpenLine,
    RiCloseLine
} from "react-icons/ri";
import { useToast } from "@/components/ui/Toast";
import { ZebraLoader } from "@/components/ui/ZebraLoader";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/DashboardPage";
import { AppIcon } from "@/components/ui/AppIcon";
import { featureChrome } from "@/components/dashboard/feature-chrome";
import { useDialogFocus } from "@/hooks/useDialogFocus";

interface WorkItem {
    id: string;
    title: string;
    category: "Project" | "Internship" | "Hackathon" | "Course" | "Award" | "Other";
    description?: string | null;
    tools?: string[] | null;
    result?: string | null;
    proofUrl?: string | null;
    isPublic: boolean;
    createdAt: string;
}

export default function MyWorkPage() {
    const [items, setItems] = useState<WorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    // Form state
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<WorkItem["category"]>("Project");
    const [description, setDescription] = useState("");
    const [toolsInput, setToolsInput] = useState("");
    const [result, setResult] = useState("");
    const [proofUrl, setProofUrl] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const closeAddModal = React.useCallback(() => { if (!submitting) setIsAddModalOpen(false); }, [submitting]);
    const addDialogRef = useDialogFocus(isAddModalOpen, closeAddModal);

    const fetchItems = React.useCallback(async (cursor?: string) => {
        try {
            if (cursor) setLoadingMore(true);
            else setLoading(true);
            const query = new URLSearchParams({ limit: "25" });
            if (cursor) query.set("cursor", cursor);
            const res = await fetch(`/api/work?${query.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setItems(previous => cursor ? [...previous, ...(data.items || [])] : (data.items || []));
                setNextCursor(data.page?.nextCursor ?? null);
            } else {
                showToast(data.error || "Error loading work items", "error");
            }
        } catch (err) {
            console.error("Failed to load work items", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [showToast]);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => { if (!cancelled) void fetchItems(); });
        return () => { cancelled = true; };
    }, [fetchItems]);


    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title.trim()) {
            showToast("Title is required", "error");
            return;
        }

        try {
            setSubmitting(true);
            const toolsArray = toolsInput.split(",").map(t => t.trim()).filter(Boolean);
            const res = await fetch("/api/work", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    category,
                    description,
                    tools: toolsArray,
                    result,
                    proofUrl: proofUrl.trim() || undefined,
                    isPublic
                }),
            });

            const data = await res.json();
            if (res.ok) {
                showToast("Work item added successfully!", "success");
                setItems(prev => [data.item, ...prev]);
                setIsAddModalOpen(false);
                resetForm();
            } else {
                showToast(data.error || "Failed to create item", "error");
            }
        } catch {
            showToast("Error submitting work item", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this work item?")) return;

        try {
            const res = await fetch(`/api/work?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Work item deleted", "success");
                setItems(prev => prev.filter(item => item.id !== id));
            } else {
                showToast("Failed to delete item", "error");
            }
        } catch {
            showToast("Error deleting item", "error");
        }
    };

    const resetForm = () => {
        setTitle("");
        setCategory("Project");
        setDescription("");
        setToolsInput("");
        setResult("");
        setProofUrl("");
        setIsPublic(false);
    };

    const filteredItems = items.filter(item => {
        const matchesFilter = filter === "All" || item.category === filter;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case "Project": return <RiFolder2Line className="w-4 h-4 text-blue-500" />;
            case "Internship": return <RiBriefcase4Line className="w-4 h-4 text-emerald-500" />;
            case "Hackathon": return <RiMagicLine className="w-4 h-4 text-amber-500" />;
            case "Course": return <RiBookOpenLine className="w-4 h-4 text-indigo-500" />;
            case "Award": return <RiAwardLine className="w-4 h-4 text-purple-500" />;
            default: return <RiCheckboxCircleLine className="w-4 h-4 text-neutral-500" />;
        }
    };

    return (
        <DashboardPage>
            <DashboardPageHeader
                title="Work"
                description="Organize your projects, internships, courses, and proof in one place."
                actions={
                    <button type="button" onClick={() => setIsAddModalOpen(true)} className={featureChrome.primaryButton}>
                        <AppIcon icon={RiAddLine} size={16} /> Add project
                    </button>
                }
            />

            <div className={`${featureChrome.card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="flex w-full items-center gap-1 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
                    {["All", "Project", "Internship", "Hackathon", "Course", "Award"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm font-medium ${
                                filter === cat
                                    ? "bg-foreground text-white"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <RiSearchLine aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search your work"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${featureChrome.input} pl-10`}
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <ZebraLoader
                    variant="inline"
                    label="Loading your work"
                    detail="Gathering projects, achievements, and proof."
                />
            ) : filteredItems.length === 0 ? (
                <div className={featureChrome.emptyState}>
                    <FeatureIcon feature="Work" size={22} className="text-muted-foreground" />
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">No work items yet</h3>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                        Add a project, internship, or course to use as proof in applications.
                    </p>
                    <button type="button" onClick={() => setIsAddModalOpen(true)} className={`${featureChrome.primaryButton} mt-4`}>
                        <AppIcon icon={RiAddLine} size={16} />
                        Add project
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredItems.map((item) => (
                        <m.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${featureChrome.card} justify-between gap-4`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                        {getCategoryIcon(item.category)}
                                        {item.category}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {item.isPublic ? (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground" title="Public in Portfolio">
                                                <AppIcon icon={RiGlobalLine} size={12} /> Public
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground" title="Private to You">
                                                <AppIcon icon={RiLockLine} size={12} /> Private
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className={featureChrome.iconButton}
                                            aria-label="Delete work item"
                                        >
                                            <AppIcon icon={RiDeleteBinLine} size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {item.result && (
                                    <div className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
                                        <span className="font-medium">Result: </span>
                                        {item.result}
                                    </div>
                                )}

                                {item.tools && item.tools.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {item.tools.map((tool, idx) => (
                                            <span key={idx} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                                {tool}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {item.proofUrl && (
                                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                                    <a
                                        href={item.proofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                                    >
                                        <AppIcon icon={RiLink} size={14} />
                                        View proof
                                    </a>
                                </div>
                            )}
                        </m.div>
                        ))}
                    </div>
                    {nextCursor && (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                disabled={loadingMore}
                                onClick={() => void fetchItems(nextCursor)}
                                className={featureChrome.secondaryButton}
                            >
                                {loadingMore ? "Loading…" : "Load more work"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className={featureChrome.backdrop} onClick={closeAddModal} />
                        <m.div
                            ref={addDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="add-work-title"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={`${featureChrome.dialog} max-w-lg`}
                        >
                            <div className={featureChrome.dialogHeader}>
                                <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
                                    <FeatureIcon feature="Work" size={18} className="text-muted-foreground" />
                                    <div className="min-w-0">
                                        <h2 id="add-work-title" className="text-base font-semibold tracking-tight text-foreground">Add work item</h2>
                                        <p className={featureChrome.helper}>Describe a project or experience you can cite.</p>
                                    </div>
                                </div>
                                <button type="button" onClick={closeAddModal} aria-label="Close add work" className={featureChrome.iconButton}>
                                    <AppIcon icon={RiCloseLine} size={18} />
                                </button>
                            </div>

                            <form id="add-work-form" onSubmit={handleCreate} className={`${featureChrome.dialogBody} space-y-4`}>
                                <div>
                                    <label className={featureChrome.label}>Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Campus marketplace web app"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={`mt-1.5 ${featureChrome.input}`}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={featureChrome.label}>Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as WorkItem["category"])}
                                        className={`mt-1.5 ${featureChrome.select}`}
                                    >
                                        <option value="Project">Project</option>
                                        <option value="Internship">Internship</option>
                                        <option value="Hackathon">Hackathon</option>
                                        <option value="Course">Course</option>
                                        <option value="Award">Award</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={featureChrome.label}>What did you do?</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Explain your contribution, challenges solved, or what you built."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className={`mt-1.5 ${featureChrome.textarea}`}
                                    />
                                </div>

                                <div>
                                    <label className={featureChrome.label}>Tools or skills (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="React, Next.js, PostgreSQL"
                                        value={toolsInput}
                                        onChange={(e) => setToolsInput(e.target.value)}
                                        className={`mt-1.5 ${featureChrome.input}`}
                                    />
                                </div>

                                <div>
                                    <label className={featureChrome.label}>Result or learning</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Used by 150 students, reduced load time by 30%"
                                        value={result}
                                        onChange={(e) => setResult(e.target.value)}
                                        className={`mt-1.5 ${featureChrome.input}`}
                                    />
                                </div>

                                <div>
                                    <label className={featureChrome.label}>Proof URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/yourusername/project"
                                        value={proofUrl}
                                        onChange={(e) => setProofUrl(e.target.value)}
                                        className={`mt-1.5 ${featureChrome.input}`}
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="rounded border-neutral-300 text-[#0A0A0A] focus:ring-[#0A0A0A]"
                                    />
                                    <label htmlFor="isPublic" className="cursor-pointer text-sm text-foreground">
                                        Visible on public portfolio
                                    </label>
                                </div>
                            </form>
                            <div className={featureChrome.dialogFooter}>
                                <button type="button" onClick={closeAddModal} className={featureChrome.ghostButton}>
                                    Cancel
                                </button>
                                <button type="submit" form="add-work-form" disabled={submitting} className={featureChrome.primaryButton}>
                                    {submitting ? "Saving..." : "Save work item"}
                                </button>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardPage>
    );
}
