"use client";

import { useEffect, useState } from "react";
import {
    CAREER_STAGE_LABELS,
    CAREER_STAGES,
    type CareerStage,
} from "@/lib/career-profile";
import { featureChrome } from "@/components/dashboard/feature-chrome";

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
                <label className={`mb-2 ${featureChrome.label}`}>
                    Which best describes you?
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CAREER_STAGES.map((stage) => (
                        <button
                            key={stage}
                            type="button"
                            onClick={() => setCareerStage(stage)}
                            className={`min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${careerStage === stage ? "border-foreground bg-foreground text-white" : "border-neutral-200 bg-white text-foreground hover:bg-muted"}`}
                        >
                            {CAREER_STAGE_LABELS[stage]}
                        </button>
                    ))}
                </div>
            </div>

            {careerStage === "professional" && (
                <div>
                    <label htmlFor="professional-years" className={`mb-2 ${featureChrome.label}`}>
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
                        className={featureChrome.input}
                        placeholder="For example, 3"
                    />
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving || (careerStage === "professional" && years === "")}
                    className={featureChrome.primaryButton}
                >
                    {saving ? "Saving..." : "Save career profile"}
                </button>
                {message && <span className="text-xs font-medium text-neutral-500">{message}</span>}
            </div>
        </div>
    );
}
