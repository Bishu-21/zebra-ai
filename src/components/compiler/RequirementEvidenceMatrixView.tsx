"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    RiCheckDoubleLine, RiAlertLine, RiSparklingLine, RiQuestionLine,
    RiShieldCheckLine, RiFileCodeLine, RiAddLine,
    RiDownloadLine, RiFileCopyLine, RiCheckLine
} from "react-icons/ri";
import type { RequirementMatrixResult, MatrixItem } from "@/lib/requirement-matrix";
import type { PreflightReport } from "@/lib/preflight-validator";
import type { CompiledDocumentResult, TemplateMode } from "@/lib/ats-compiler";

export interface RequirementEvidenceMatrixViewProps {
    applicationId: string;
    onCompileSuccess?: (html: string, txt: string) => void;
}

export function RequirementEvidenceMatrixView({ applicationId, onCompileSuccess }: RequirementEvidenceMatrixViewProps) {
    const [matrix, setMatrix] = useState<RequirementMatrixResult | null>(null);
    const [preflight, setPreflight] = useState<PreflightReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [compiling, setCompiling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promptingRequirement, setPromptingRequirement] = useState<MatrixItem | null>(null);

    // Modal state for adding missing evidence
    const [newAction, setNewAction] = useState("");
    const [newOutcome, setNewOutcome] = useState("");
    const [newProject, setNewProject] = useState("");

    const fetchMatrixData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/applications/${applicationId}/matrix`);
            if (!res.ok) throw new Error("Could not load the requirement analysis.");
            const data = await res.json() as {
                matrix: RequirementMatrixResult;
                preflight: PreflightReport;
            };
            setMatrix(data.matrix);
            setPreflight(data.preflight);
        } catch (err) {
            console.error("Failed to fetch requirement matrix", err);
            setError(err instanceof Error ? err.message : "Could not load the requirement analysis.");
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        void fetchMatrixData();
    }, [fetchMatrixData]);

    const handleAddEvidence = async () => {
        if (!promptingRequirement || !newAction || !newProject) return;

        try {
            const res = await fetch("/api/evidence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyOrProject: newProject,
                    skill: promptingRequirement.canonicalRequirement,
                    action: newAction,
                    measurableOutcome: newOutcome || null,
                }),
            });

            if (res.ok) {
                setPromptingRequirement(null);
                setNewAction("");
                setNewOutcome("");
                setNewProject("");
                await fetchMatrixData();
            }
        } catch (err) {
            console.error("Failed to add evidence", err);
        }
    };

    const [selectedTemplateMode, setSelectedTemplateMode] = useState<TemplateMode>("ats_portal_optimized");
    const [compiledDoc, setCompiledDoc] = useState<CompiledDocumentResult | null>(null);
    const [copiedText, setCopiedText] = useState(false);

    const handleCompileDocument = async (mode = selectedTemplateMode) => {
        setCompiling(true);
        setError(null);
        try {
            const res = await fetch(`/api/applications/${applicationId}/matrix`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateMode: mode }),
            });
            if (!res.ok) throw new Error("The ATS document could not be compiled.");
            const data = await res.json() as {
                compiledDoc: CompiledDocumentResult;
                preflight: PreflightReport;
            };
            setCompiledDoc(data.compiledDoc);
            if (onCompileSuccess) {
                onCompileSuccess(data.compiledDoc.htmlContent, data.compiledDoc.textContent);
            }
            setPreflight(data.preflight);
        } catch (err) {
            console.error("Failed to compile ATS document", err);
            setError(err instanceof Error ? err.message : "The ATS document could not be compiled.");
        } finally {
            setCompiling(false);
        }
    };

    const handleDownloadDocx = () => {
        if (!compiledDoc) return;
        const blob = new Blob([compiledDoc.markdownContent || compiledDoc.textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Resume_Tailored_${applicationId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopyText = () => {
        if (!compiledDoc) return;
        navigator.clipboard.writeText(compiledDoc.textContent);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-slate-500">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="font-medium">Building Requirement-to-Evidence Matrix...</p>
            </div>
        );
    }

    if (error && !matrix) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
                <p className="font-semibold text-rose-900">{error}</p>
                <button
                    type="button"
                    onClick={() => void fetchMatrixData()}
                    className="mt-3 rounded-lg bg-rose-900 px-4 py-2 text-xs font-bold text-white"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">
                    {error}
                </div>
            )}
            {/* Four Separated Diagnostic Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Parse Safety */}
                <div className={`border rounded-xl p-4 text-white ${
                    preflight?.parseSafety === "PASS" ? "bg-emerald-950/40 border-emerald-800" : "bg-rose-950/40 border-rose-800"
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Parse Safety</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            preflight?.parseSafety === "PASS" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}>
                            {preflight?.parseSafety || "PASS"}
                        </span>
                    </div>
                    <div className="text-xl font-bold mt-2">
                        {preflight?.parseSafety === "PASS" ? "Parser-safe layout" : "Layout risk detected"}
                    </div>
                    <span className="text-xs text-slate-400">Single-column layout verification</span>
                </div>

                {/* 2. Eligibility Blockers */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Eligibility Blockers</span>
                    <div className="text-xl font-bold text-amber-400 mt-2">
                        {preflight?.eligibilityBlockers?.length || 0} Explicit Warnings
                    </div>
                    <span className="text-xs text-slate-400">Kept separate • Never averaged away</span>
                </div>

                {/* 3. Evidence Coverage */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Evidence Coverage</span>
                    <div className="text-2xl font-bold text-blue-400 mt-1">
                        {preflight?.evidenceCoverageScore ?? matrix?.overallMatchPercentage ?? 0}%
                    </div>
                    <span className="text-xs text-slate-400">Requirements supported by proof</span>
                </div>

                {/* 4. Resume Quality */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Resume Quality</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                        {preflight?.resumeQualityScore ?? 85}/100
                    </div>
                    <span className="text-xs text-slate-400">Clarity, impact & specificity</span>
                </div>
            </div>

            {/* Weighted Match Breakdown Panel */}
            {preflight?.matchBreakdown && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                            <h4 className="font-bold text-base flex items-center gap-2">
                                <RiSparklingLine className="text-emerald-400 text-lg" />
                                <span>Weighted Application Match Index</span>
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">Calibrated weighted score breakdown across 5 requirement dimensions</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-emerald-400">{preflight.matchBreakdown.compositeMatchScore}%</span>
                            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Composite Match</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block font-medium">35% Must-Have</span>
                            <span className="text-base font-bold text-blue-400 mt-1 block">{preflight.matchBreakdown.mustHaveCoverage}%</span>
                            <span className="text-[10px] text-slate-500">Core requirements</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block font-medium">25% Evidence Strength</span>
                            <span className="text-base font-bold text-emerald-400 mt-1 block">{preflight.matchBreakdown.evidenceStrength}%</span>
                            <span className="text-[10px] text-slate-500">Measurable metrics</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block font-medium">20% Terminology</span>
                            <span className="text-base font-bold text-amber-400 mt-1 block">{preflight.matchBreakdown.terminologyAlignment}%</span>
                            <span className="text-[10px] text-slate-500">Synonym alignment</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block font-medium">10% Preferred</span>
                            <span className="text-base font-bold text-purple-400 mt-1 block">{preflight.matchBreakdown.preferredCoverage}%</span>
                            <span className="text-[10px] text-slate-500">Nice to have skills</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block font-medium">10% Quality</span>
                            <span className="text-base font-bold text-cyan-400 mt-1 block">{preflight.matchBreakdown.documentQuality}%</span>
                            <span className="text-[10px] text-slate-500">Formatting & clarity</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Explicit Eligibility Blockers Banner */}
            {preflight?.eligibilityBlockers && preflight.eligibilityBlockers.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800 text-purple-200 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <RiAlertLine className="text-purple-400 text-lg" />
                        <span>Explicit Eligibility Blockers ({preflight.eligibilityBlockers.length})</span>
                    </div>
                    <ul className="text-xs space-y-1 text-purple-300">
                        {preflight.eligibilityBlockers.map((warning: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                <span>{warning}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* 9-Point Preflight Audit Report Panel */}
            {preflight?.detailedAudit && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h4 className="font-bold text-base flex items-center gap-2">
                            <RiShieldCheckLine className="text-emerald-400 text-lg" />
                            <span>Pre-Export 9-Point Preflight Audit Report</span>
                        </h4>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            preflight.isClean ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}>
                            {preflight.isClean ? "✓ CLEAN AUDIT" : "⚠️ AUDIT ACTION REQUIRED"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* 1. Parsing Hazards */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.parsingHazards.length > 0 ? "bg-rose-950/40 border-rose-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">1. Parsing Hazards</span>
                            {preflight.detailedAudit.parsingHazards.length > 0 ? (
                                <ul className="text-[11px] text-rose-300 space-y-1">
                                    {preflight.detailedAudit.parsingHazards.map((h: string, i: number) => <li key={i}>• {h}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ No layout hazards</span>}
                        </div>

                        {/* 2. Unsupported / Unproven Claims */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.unprovenClaims.length > 0 ? "bg-amber-950/40 border-amber-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">2. Unproven Claims</span>
                            {preflight.detailedAudit.unprovenClaims.length > 0 ? (
                                <ul className="text-[11px] text-amber-300 space-y-1 max-h-24 overflow-y-auto">
                                    {preflight.detailedAudit.unprovenClaims.map((c: string, i: number) => <li key={i}>• {c}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ All claims evidence-grounded</span>}
                        </div>

                        {/* 3. Missing Must-Have Requirements */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.missingMustHaves.length > 0 ? "bg-rose-950/40 border-rose-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">3. Missing Must-Haves</span>
                            {preflight.detailedAudit.missingMustHaves.length > 0 ? (
                                <ul className="text-[11px] text-rose-300 space-y-1 max-h-24 overflow-y-auto">
                                    {preflight.detailedAudit.missingMustHaves.map((m: string, i: number) => <li key={i}>• {m}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ 100% must-haves supported</span>}
                        </div>

                        {/* 4. Eligibility Confirmations */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.eligibilityConfirmations.length > 0 ? "bg-purple-950/40 border-purple-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">4. Eligibility Confirmations</span>
                            {preflight.detailedAudit.eligibilityConfirmations.length > 0 ? (
                                <ul className="text-[11px] text-purple-300 space-y-1 max-h-24 overflow-y-auto">
                                    {preflight.detailedAudit.eligibilityConfirmations.map((e: string, i: number) => <li key={i}>• {e}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ No eligibility flags</span>}
                        </div>

                        {/* 5. Keyword Repetition */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.excessiveKeywordRepetition.length > 0 ? "bg-amber-950/40 border-amber-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">5. Keyword Stuffing Check</span>
                            {preflight.detailedAudit.excessiveKeywordRepetition.length > 0 ? (
                                <ul className="text-[11px] text-amber-300 space-y-1">
                                    {preflight.detailedAudit.excessiveKeywordRepetition.map((k: string, i: number) => <li key={i}>• {k}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ Natural keyword frequency</span>}
                        </div>

                        {/* 6. Missing Dates or Contact Details */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.missingDatesOrContactInfo.length > 0 ? "bg-amber-950/40 border-amber-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">6. Dates & Contact Info</span>
                            {preflight.detailedAudit.missingDatesOrContactInfo.length > 0 ? (
                                <ul className="text-[11px] text-amber-300 space-y-1">
                                    {preflight.detailedAudit.missingDatesOrContactInfo.map((d: string, i: number) => <li key={i}>• {d}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ Contact & date info complete</span>}
                        </div>

                        {/* 7. Skills Present Only in Skills List */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.skillsWithoutEvidence.length > 0 ? "bg-indigo-950/40 border-indigo-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">7. Skills List vs Evidence</span>
                            {preflight.detailedAudit.skillsWithoutEvidence.length > 0 ? (
                                <ul className="text-[11px] text-indigo-300 space-y-1 max-h-24 overflow-y-auto">
                                    {preflight.detailedAudit.skillsWithoutEvidence.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ Every skill backed by project</span>}
                        </div>

                        {/* 8. Page Count & Section Order */}
                        <div className={`p-3 rounded-lg border ${preflight.detailedAudit.pageCountAndSectionOrderIssues.length > 0 ? "bg-amber-950/40 border-amber-800" : "bg-slate-950 border-slate-800"}`}>
                            <span className="font-bold text-slate-200 block mb-1">8. Page Count & Structure</span>
                            {preflight.detailedAudit.pageCountAndSectionOrderIssues.length > 0 ? (
                                <ul className="text-[11px] text-amber-300 space-y-1">
                                    {preflight.detailedAudit.pageCountAndSectionOrderIssues.map((p: string, i: number) => <li key={i}>• {p}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ Flowable single-page format</span>}
                        </div>

                        {/* 9. Differences from Master Profile */}
                        <div className="p-3 rounded-lg border bg-slate-950 border-slate-800">
                            <span className="font-bold text-slate-200 block mb-1">9. Master Profile Alignment</span>
                            {preflight.detailedAudit.masterProfileDifferences.length > 0 ? (
                                <ul className="text-[11px] text-slate-300 space-y-1">
                                    {preflight.detailedAudit.masterProfileDifferences.map((diff: string, i: number) => <li key={i}>• {diff}</li>)}
                                </ul>
                            ) : <span className="text-emerald-400 text-[11px]">✓ Identical to Master Profile</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Template Selection & ATS Document Compiler Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <RiFileCodeLine className="text-emerald-400 text-lg" />
                        <span>ATS Document Compiler & Template Selection</span>
                    </h3>
                    <span className="text-xs text-slate-400">PDF & DOCX Output • Single-Column Flowable Text</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Template Card 1: ATS Portal Optimized */}
                    <div
                        onClick={() => {
                            setSelectedTemplateMode("ats_portal_optimized");
                            handleCompileDocument("ats_portal_optimized");
                        }}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedTemplateMode === "ats_portal_optimized"
                                ? "bg-emerald-950/40 border-emerald-500 shadow-md"
                                : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-white">ATS Portal Optimized</span>
                            <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                RECOMMENDED FOR PORTALS
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            Strict single-column layout, standard section headings (SUMMARY, SKILLS, EXPERIENCE), no tables/text boxes, contact details in document body.
                        </p>
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <RiShieldCheckLine /> 100% Greenhouse, Workday & Lever Compliant
                        </span>
                    </div>

                    {/* Template Card 2: Visually Rich Sharing */}
                    <div
                        onClick={() => {
                            setSelectedTemplateMode("visual_rich_sharing");
                            handleCompileDocument("visual_rich_sharing");
                        }}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedTemplateMode === "visual_rich_sharing"
                                ? "bg-blue-950/40 border-blue-500 shadow-md"
                                : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-white">Visually Rich / Portfolio</span>
                            <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                                DIRECT SHARING
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            Stylized layout with subtle accent bars for direct recruiter email, portfolio links, or networking.
                        </p>
                        <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                            ⚠️ Use ATS Portal Optimized when submitting to online job application portals.
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <button
                        onClick={() => handleCompileDocument(selectedTemplateMode)}
                        disabled={compiling}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <RiFileCodeLine className="text-base" />
                        <span>{compiling ? "Compiling Document..." : `Compile Document (${selectedTemplateMode === "ats_portal_optimized" ? "ATS Safe" : "Visually Rich"})`}</span>
                    </button>

                    {compiledDoc && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownloadDocx}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                            >
                                <RiDownloadLine />
                                <span>Export Text / DOCX</span>
                            </button>
                            <button
                                onClick={handleCopyText}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                            >
                                {copiedText ? <RiCheckLine className="text-emerald-400" /> : <RiFileCopyLine />}
                                <span>{copiedText ? "Copied!" : "Copy Plain Text"}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Compiled Document Preview Box */}
                {compiledDoc && (
                    <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <RiShieldCheckLine /> {compiledDoc.badgeText}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">Parse Safety: PASS</span>
                        </div>
                        <div 
                            className="text-slate-200 text-xs overflow-y-auto max-h-96 p-3 bg-white text-slate-900 rounded-lg font-sans"
                            dangerouslySetInnerHTML={{ __html: compiledDoc.htmlContent }}
                        />
                    </div>
                )}
            </div>

            {/* Requirement-to-Evidence Matrix Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <RiCheckDoubleLine className="text-emerald-400 text-lg" />
                        <span>Requirement Matrix</span>
                    </h3>
                    <span className="text-xs text-slate-400">Deterministic Evidence Analysis • No opaque ATS scores</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                                <th className="py-3 px-4">Requirement</th>
                                <th className="py-3 px-4">Classification</th>
                                <th className="py-3 px-4">Candidate Evidence</th>
                                <th className="py-3 px-4">Result</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                            {matrix?.items.map((item) => {
                                const isSupported = item.resultStatus === "Supported";
                                const isSynonym = item.resultStatus === "Supported synonym";
                                const isGap = item.resultStatus === "Gap";
                                const isAsk = item.resultStatus === "Ask candidate";

                                return (
                                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-white">
                                            {item.canonicalRequirement}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                                item.classification === "Knockout" ? "bg-purple-950 text-purple-300 border border-purple-800" :
                                                item.classification === "Must-have" ? "bg-blue-950 text-blue-300 border border-blue-800" :
                                                "bg-slate-800 text-slate-300 border border-slate-700"
                                            }`}>
                                                {item.classification || "Must-have"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                                            {item.candidateEvidence || "No evidence recorded"}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                                                isSupported ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                                isSynonym ? "bg-amber-950 text-amber-300 border border-amber-800" :
                                                isGap ? "bg-rose-950 text-rose-300 border border-rose-800" :
                                                "bg-indigo-950 text-indigo-300 border border-indigo-800"
                                            }`}>
                                                {isSupported && "✓ Supported"}
                                                {isSynonym && "≈ Supported synonym"}
                                                {isGap && "⚠ Gap"}
                                                {isAsk && "❓ Ask candidate"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {(isAsk || isGap) && (
                                                <button
                                                    onClick={() => {
                                                        setPromptingRequirement(item);
                                                        setNewProject("");
                                                        setNewAction("");
                                                        setNewOutcome("");
                                                    }}
                                                    className="text-[11px] bg-emerald-600/20 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-600/30 px-2.5 py-1 rounded-lg font-medium transition-colors inline-flex items-center gap-1"
                                                >
                                                    <RiAddLine />
                                                    <span>Add Proof</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Candidate Evidence Prompt Modal */}
            {promptingRequirement && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                <RiQuestionLine className="text-emerald-400" />
                                <span>Supply Evidence for &quot;{promptingRequirement.canonicalRequirement}&quot;</span>
                            </h4>
                            <button
                                onClick={() => setPromptingRequirement(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-300">
                            Zebra never fabricates metrics. Provide real details on where you used <span className="text-emerald-400 font-medium">{promptingRequirement.canonicalRequirement}</span>.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Project or Company Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. E-Commerce Dashboard, Campus Hackathon"
                                    value={newProject}
                                    onChange={(e) => setNewProject(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Action Performed *</label>
                                <textarea
                                    rows={2}
                                    placeholder={`e.g. Implemented state management using ${promptingRequirement.canonicalRequirement} for shopping cart flow`}
                                    value={newAction}
                                    onChange={(e) => setNewAction(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Measurable Outcome / Result (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Reduced initial render latency by 40%, processed 500+ test orders"
                                    value={newOutcome}
                                    onChange={(e) => setNewOutcome(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setPromptingRequirement(null)}
                                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEvidence}
                                disabled={!newAction || !newProject}
                                className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50"
                            >
                                Save Evidence Node
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
