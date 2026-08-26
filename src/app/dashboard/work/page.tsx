"use client";

import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
    RiAddLine,
    RiFolder2Line,
    RiAwardLine,
    RiBriefcase4Line,
    RiExternalLinkLine,
    RiDeleteBin6Line,
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
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-1">Work</h1>
                    <p className="text-xs font-normal text-neutral-500 leading-relaxed">
                        Organize your projects, hackathons, internships, certificates, and proof in one place.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-neutral-800 transition-all shadow-2xs active:scale-95 shrink-0"
                >
                    <RiAddLine size={16} /> Add project
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-neutral-100 p-3 rounded-2xl shadow-sm">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {["All", "Project", "Internship", "Hackathon", "Course", "Award"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                filter === cat
                                    ? "bg-[#0A0A0A] text-white shadow-sm"
                                    : "text-neutral-500 hover:text-[#0A0A0A] hover:bg-neutral-50"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <RiSearchLine className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search your work..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
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
                <div className="py-16 px-6 border-2 border-dashed border-neutral-200 rounded-3xl text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                        <RiFolder2Line className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#0A0A0A]">No work items saved yet</h3>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                            Add a project, internship, or hackathon to build proof for your applications.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all shadow-sm"
                    >
                        <RiAddLine className="w-4 h-4" />
                        + Add project
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
                            className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-100 text-[11px] font-bold text-neutral-700">
                                        {getCategoryIcon(item.category)}
                                        {item.category}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {item.isPublic ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" title="Public in Portfolio">
                                                <RiGlobalLine className="w-3 h-3" /> Public
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md" title="Private to You">
                                                <RiLockLine className="w-3 h-3" /> Private
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-neutral-300 hover:text-red-500 transition-colors p-1"
                                            title="Delete item"
                                        >
                                            <RiDeleteBin6Line className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-[#0A0A0A] group-hover:text-neutral-700 transition-colors">
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p className="text-xs text-neutral-600 line-clamp-3 mt-1 font-medium leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {item.result && (
                                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 text-[11px] text-neutral-700">
                                        <span className="font-bold text-[#0A0A0A]">Key Result / Proof: </span>
                                        {item.result}
                                    </div>
                                )}

                                {item.tools && item.tools.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {item.tools.map((tool, idx) => (
                                            <span key={idx} className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
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
                                        className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline"
                                    >
                                        <RiExternalLinkLine className="w-3.5 h-3.5" />
                                        View Proof Link
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
                                className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                            >
                                {loadingMore ? "Loading…" : "Load more work"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add Work Item Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <m.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                                <div>
                                    <h2 className="text-xl font-black text-[#0A0A0A]">Add What You Built</h2>
                                    <p className="text-xs text-neutral-500 font-medium">Add details of your real experience so Zebra can present it honestly.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-neutral-400 hover:text-[#0A0A0A] font-bold text-sm"
                                >
                                    <RiCloseLine className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-4 text-xs font-medium">
                                <div>
                                    <label className="block text-[#0A0A0A] font-bold mb-1">Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Campus Marketplace Web App"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#0A0A0A] font-bold mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as WorkItem["category"])}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:outline-none"
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
                                    <label className="block text-[#0A0A0A] font-bold mb-1">What did you do?</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Explain your contribution, challenges solved, or what you built."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#0A0A0A] font-bold mb-1">Tools or Skills Used (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="React, Next.js, PostgreSQL, TailwindCSS"
                                        value={toolsInput}
                                        onChange={(e) => setToolsInput(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#0A0A0A] font-bold mb-1">Result or Learning</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Used by 150 students, reduced load time by 30%"
                                        value={result}
                                        onChange={(e) => setResult(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#0A0A0A] font-bold mb-1">Link or Proof URL (GitHub / Demo / Certificate)</label>
                                    <input
                                        type="url"
                                        placeholder="https://github.com/yourusername/project"
                                        value={proofUrl}
                                        onChange={(e) => setProofUrl(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-[#0A0A0A] focus:outline-none"
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
                                    <label htmlFor="isPublic" className="text-xs text-neutral-700 font-semibold cursor-pointer">
                                        Make visible on public portfolio
                                    </label>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-neutral-500 hover:text-[#0A0A0A] font-bold text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-[#0A0A0A] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? "Saving..." : "Save Work Item"}
                                    </button>
                                </div>
                            </form>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
