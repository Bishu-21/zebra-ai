"use client";

import { useEffect, useState } from "react";
import {
    CAREER_STAGE_LABELS,
    CAREER_STAGES,
    type CareerStage,
} from "@/lib/career-profile";

interface CareerProfileFormProps {
    initialStage?: string | null;
    initialYears?: number | null;
    onSaved?: (profile: { careerStage: string; professionalExperienceYears: number | null }) => void;
    compact?: boolean;
}

export function CareerProfileForm({ initialStage, initialYears, onSaved, compact = false }: CareerProfileFormProps) {
    const validInitialStage = CAREER_STAGES.includes(initialStage as CareerStage)
        ? initialStage as CareerStage
        : "first_year_student";
    const [careerStage, setCareerStage] = useState<CareerStage>(validInitialStage);
    const [years, setYears] = useState(initialYears?.toString() ?? "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        queueMicrotask(() => {
            if (CAREER_STAGES.includes(initialStage as CareerStage)) setCareerStage(initialStage as CareerStage);
            setYears(initialYears?.toString() ?? "");
        });
    }, [initialStage, initialYears]);

    async function save() {
        setSaving(true);
        setMessage(null);
        try {
            const response = await fetch("/api/profile/career", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    careerStage,
                    professionalExperienceYears: careerStage === "professional" && years !== ""
                        ? Number(years)
                        : null,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || "Could not save career profile");
            setMessage("Career profile saved");
            onSaved?.(payload);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not save career profile");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={compact ? "space-y-4" : "space-y-5"}>
            <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Which best describes you?
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CAREER_STAGES.map((stage) => (
                        <button
                            key={stage}
                            type="button"
                            onClick={() => setCareerStage(stage)}
                            className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-colors ${careerStage === stage ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`}
                        >
                            {CAREER_STAGE_LABELS[stage]}
                        </button>
                    ))}
                </div>
            </div>

            {careerStage === "professional" && (
                <div>
                    <label htmlFor="professional-years" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Years of professional experience
                    </label>
                    <input
                        id="professional-years"
                        type="number"
                        min={0}
                        max={60}
                        step={1}
                        value={years}
                        onChange={(event) => setYears(event.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-black focus:bg-white"
                        placeholder="For example, 3"
                    />
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || (careerStage === "professional" && years === "")}
                    className="rounded-xl bg-black px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {saving ? "Saving..." : "Save career profile"}
                </button>
                {message && <span className="text-xs font-medium text-neutral-500">{message}</span>}
            </div>
        </div>
    );
}
