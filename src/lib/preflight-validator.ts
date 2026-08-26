import { RequirementMatrixResult } from "@/lib/requirement-matrix";
import { db } from "@/lib/db";
import { preflightChecks } from "@/lib/schema";
import { testStore } from "@/lib/test-store";
import { isTestStoreActive } from "@/lib/auth-policy";

export interface MatchBreakdown {
    mustHaveCoverage: number;     // 35% weight: Must-have requirement coverage
    evidenceStrength: number;     // 25% weight: Action + Measurable outcome presence
    terminologyAlignment: number; // 20% weight: Exact & synonym alignment ratio
    preferredCoverage: number;    // 10% weight: Preferred requirement coverage
    documentQuality: number;      // 10% weight: Text specificity & formatting quality
    compositeMatchScore: number;  // Calibrated weighted match score
}

export interface DetailedAuditChecks {
    parsingHazards: string[];                // 1. Parsing hazards (tables, multi-column, header/footer)
    unprovenClaims: string[];                // 2. Unsupported or unproven claims
    missingMustHaves: string[];              // 3. Missing must-have requirements
    eligibilityConfirmations: string[];      // 4. Eligibility questions requiring confirmation
    excessiveKeywordRepetition: string[];    // 5. Excessive keyword repetition / keyword stuffing
    missingDatesOrContactInfo: string[];      // 6. Missing dates or contact information
    skillsWithoutEvidence: string[];         // 7. Skills present only in skills list, not in evidence
    pageCountAndSectionOrderIssues: string[];// 8. Page count & section-order problems
    masterProfileDifferences: string[];      // 9. Differences from candidate's master profile
}

export interface PreflightReport {
    id: string;
    applicationId: string;
    userId: string;
    
    // Four Separated Diagnostic Indicators
    parseSafety: "PASS" | "FAIL";
    eligibilityBlockers: string[]; // Explicit warnings (never averaged away)
    evidenceCoverageScore: number; // Percentage of requirements supported
    resumeQualityScore: number;   // Clarity, specificity, impact (0-100)

    // Weighted Match Breakdown
    matchBreakdown: MatchBreakdown;

    // Detailed 9-Point Audit Report
    detailedAudit: DetailedAuditChecks;

    atsSafetyScore: number; // 0-100 backward compatibility
    parsingRiskFlags: string[];
    hardEligibilityFlags: string[];
    terminologyMismatchCount: number;
    isClean: boolean;
    recommendations: string[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Runs preflight validation on an application package prior to submission or export.
 * Performs a comprehensive 9-point audit before export.
 */
export async function runPreflightValidation(
    userId: string,
    applicationId: string,
    matrixResult: RequirementMatrixResult,
    jobDescription?: string | null,
    resumeContent?: string | null,
    basics?: { name?: string; email?: string; phone?: string; location?: string } | null,
    options: { persist?: boolean } = {},
): Promise<PreflightReport> {
    const parsingRiskFlags: string[] = [];
    const hardEligibilityFlags: string[] = [];
    const recommendations: string[] = [];

    // 1. Parsing Hazards Check
    const parsingHazards: string[] = [];
    if (resumeContent) {
        if (/<table|<\/table>/i.test(resumeContent)) {
            const msg = "Table element detected; some resume parsers may not preserve table reading order";
            parsingRiskFlags.push(msg);
            parsingHazards.push(msg);
        }
        if (/column-count|display:\s*grid|flex-direction:\s*row/i.test(resumeContent)) {
            const msg = "Multi-column visual structure detected";
            parsingRiskFlags.push(msg);
            parsingHazards.push(msg);
        }
        if (/<header|<footer>|<div[^>]*class=["'].*header|footer/i.test(resumeContent)) {
            const msg = "Header/Footer section detected (ATS parsers often strip headers/footers)";
            parsingRiskFlags.push(msg);
            parsingHazards.push(msg);
        }
    }
    const parseSafety: "PASS" | "FAIL" = parsingHazards.length === 0 ? "PASS" : "FAIL";

    // 2. Unsupported or Unproven Claims
    const unprovenClaims: string[] = [];
    const weakItems = matrixResult.items.filter(i => i.matchStatus === "weak_evidence");
    weakItems.forEach(w => {
        unprovenClaims.push(`Skill "${w.canonicalRequirement}" is listed without a measurable outcome or proof URL.`);
    });

    // 3. Missing Must-Have Requirements
    const missingMustHaves: string[] = [];
    const missingMustHaveItems = matrixResult.items.filter(i => i.classification === "Must-have" && (i.resultStatus === "Gap" || i.resultStatus === "Ask candidate"));
    missingMustHaveItems.forEach(m => {
        missingMustHaves.push(`Missing Must-Have: "${m.canonicalRequirement}" has no recorded evidence.`);
    });

    // 4. Eligibility Questions Requiring Confirmation
    const eligibilityConfirmations: string[] = [];
    if (jobDescription) {
        const jdLower = jobDescription.toLowerCase();
        if (jdLower.includes("us citizen") || jdLower.includes("clearance required") || jdLower.includes("work authorization")) {
            const msg = "Confirm Work Authorization / Security Clearance status for this role.";
            hardEligibilityFlags.push(msg);
            eligibilityConfirmations.push(msg);
        }
        if (jdLower.includes("bachelor") || jdLower.includes("degree required")) {
            const msg = "Confirm Bachelor's Degree / Education Requirement.";
            hardEligibilityFlags.push(msg);
            eligibilityConfirmations.push(msg);
        }
        if (jdLower.includes("on-site") || jdLower.includes("relocation")) {
            const msg = "Confirm Location / On-site requirement compatibility.";
            hardEligibilityFlags.push(msg);
            eligibilityConfirmations.push(msg);
        }
    }
    const knockoutItems = matrixResult.items.filter(i => i.classification === "Knockout" && i.resultStatus === "Ask candidate");
    knockoutItems.forEach(k => {
        const msg = `Knockout Rule: "${k.canonicalRequirement}" status requires user confirmation.`;
        if (!eligibilityConfirmations.includes(msg)) {
            eligibilityConfirmations.push(msg);
            hardEligibilityFlags.push(msg);
        }
    });

    // 5. Excessive Keyword Repetition (Keyword stuffing check)
    const excessiveKeywordRepetition: string[] = [];
    if (resumeContent) {
        const words = resumeContent.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const freqMap = new Map<string, number>();
        words.forEach(w => freqMap.set(w, (freqMap.get(w) || 0) + 1));
        freqMap.forEach((count, word) => {
            if (count > 6 && !["and", "the", "for", "with", "using", "built", "project"].includes(word)) {
                excessiveKeywordRepetition.push(`Keyword "${word}" is repeated ${count} times (risk of keyword stuffing penalty).`);
            }
        });
    }

    // 6. Missing Dates or Contact Information
    const missingDatesOrContactInfo: string[] = [];
    if (basics) {
        if (!basics.email) missingDatesOrContactInfo.push("Missing email address in contact details.");
        if (!basics.phone) missingDatesOrContactInfo.push("Missing phone number in contact details.");
        if (!basics.location) missingDatesOrContactInfo.push("Missing location / city state in contact details.");
    }

    // 7. Skills Present Only in a Skills List, Not in Evidence
    const skillsWithoutEvidence: string[] = [];
    matrixResult.items.forEach(item => {
        if ((item.matchStatus === "weak_evidence" || item.resultStatus === "Ask candidate") && item.classification !== "Knockout") {
            skillsWithoutEvidence.push(`Skill "${item.canonicalRequirement}" appears in skills list but lacks specific project bullet points.`);
        }
    });

    // 8. Page Count and Section-Order Problems
    const pageCountAndSectionOrderIssues: string[] = [];
    if (resumeContent) {
        const cleanText = resumeContent.replace(/<[^>]*>/g, " ");
        const wordCount = cleanText.trim().split(/\s+/).length;
        if (wordCount > 600) {
            pageCountAndSectionOrderIssues.push(`Document length is ${wordCount} words (exceeds single-page flowable length of ~500 words).`);
        }
        if (cleanText.indexOf("EDUCATION") > -1 && cleanText.indexOf("EXPERIENCE") > -1) {
            if (cleanText.indexOf("EDUCATION") < cleanText.indexOf("EXPERIENCE")) {
                pageCountAndSectionOrderIssues.push("Education is placed before Experience (for mid-level roles, place Experience first).");
            }
        }
    }

    // 9. Differences from Candidate's Master Profile
    const masterProfileDifferences: string[] = [];
    if (matrixResult.terminologyMismatchCount > 0) {
        masterProfileDifferences.push(`${matrixResult.terminologyMismatchCount} terminology normalization(s) applied to align with job description wording.`);
    }

    const detailedAudit: DetailedAuditChecks = {
        parsingHazards,
        unprovenClaims,
        missingMustHaves,
        eligibilityConfirmations,
        excessiveKeywordRepetition,
        missingDatesOrContactInfo,
        skillsWithoutEvidence,
        pageCountAndSectionOrderIssues,
        masterProfileDifferences,
    };

    // Score Calculations
    const totalReqs = matrixResult.items.length;
    const supportedReqs = matrixResult.items.filter(i => i.resultStatus === "Supported" || i.resultStatus === "Supported synonym").length;
    const evidenceCoverageScore = totalReqs > 0 ? Math.round((supportedReqs / totalReqs) * 100) : 100;

    let resumeQualityScore = 90;
    if (weakItems.length > 0) resumeQualityScore -= Math.min(20, weakItems.length * 5);
    if (parsingHazards.length > 0) resumeQualityScore -= 25;
    if (missingMustHaves.length > 0) resumeQualityScore -= 15;
    resumeQualityScore = Math.max(30, Math.min(100, resumeQualityScore));

    // Weighted Match Breakdown Formula (35% must-have, 25% evidence strength, 20% terminology, 10% preferred, 10% quality)
    const mustHaveItems = matrixResult.items.filter(i => i.classification === "Must-have");
    const mustHaveSupported = mustHaveItems.filter(i => i.resultStatus === "Supported" || i.resultStatus === "Supported synonym").length;
    const mustHaveCoverage = mustHaveItems.length > 0 ? Math.round((mustHaveSupported / mustHaveItems.length) * 100) : 100;

    const exactMatches = matrixResult.items.filter(i => i.matchStatus === "exact_match").length;
    const evidenceStrength = totalReqs > 0 ? Math.round((exactMatches / totalReqs) * 100) : 100;

    const alignedTerms = matrixResult.items.filter(i => i.matchStatus === "exact_match" || i.matchStatus === "terminology_mismatch").length;
    const terminologyAlignment = totalReqs > 0 ? Math.round((alignedTerms / totalReqs) * 100) : 100;

    const preferredItems = matrixResult.items.filter(i => i.classification === "Preferred");
    const preferredSupported = preferredItems.filter(i => i.resultStatus === "Supported" || i.resultStatus === "Supported synonym").length;
    const preferredCoverage = preferredItems.length > 0 ? Math.round((preferredSupported / preferredItems.length) * 100) : 100;

    const compositeMatchScore = Math.round(
        (mustHaveCoverage * 0.35) +
        (evidenceStrength * 0.25) +
        (terminologyAlignment * 0.20) +
        (preferredCoverage * 0.10) +
        (resumeQualityScore * 0.10)
    );

    const matchBreakdown: MatchBreakdown = {
        mustHaveCoverage,
        evidenceStrength,
        terminologyAlignment,
        preferredCoverage,
        documentQuality: resumeQualityScore,
        compositeMatchScore,
    };

    // Human-centric recommendations
    if (parseSafety === "FAIL") recommendations.push("Parse Safety FAIL: Multi-column CSS, tables, or header/footer elements detected.");
    if (eligibilityConfirmations.length > 0) recommendations.push(`${eligibilityConfirmations.length} Eligibility items require user confirmation.`);
    if (missingMustHaves.length > 0) recommendations.push(`${missingMustHaves.length} missing must-have requirements. Add real evidence.`);
    if (parseSafety === "PASS" && eligibilityConfirmations.length === 0 && missingMustHaves.length === 0) {
        recommendations.push("Clean preflight audit! Passed all 9 preflight checks.");
    }

    const isClean = parseSafety === "PASS" && eligibilityConfirmations.length === 0 && missingMustHaves.length === 0;
    const atsSafetyScore = parseSafety === "PASS" ? 100 : 50;
    const now = new Date();
    const id = `pref_${applicationId}`;

    const report: PreflightReport = {
        id,
        applicationId,
        userId,
        parseSafety,
        eligibilityBlockers: eligibilityConfirmations,
        evidenceCoverageScore,
        resumeQualityScore,
        matchBreakdown,
        detailedAudit,
        atsSafetyScore,
        parsingRiskFlags,
        hardEligibilityFlags,
        terminologyMismatchCount: matrixResult.terminologyMismatchCount,
        isClean,
        recommendations,
        createdAt: now,
        updatedAt: now,
    };

    if (options.persist !== false && isTestStoreActive()) {
        testStore.preflightChecks.set(id, report);
    } else if (options.persist !== false) {
        await db.insert(preflightChecks)
            .values({
                id,
                applicationId,
                userId,
                atsSafetyScore,
                evidenceCoverageScore,
                parsingRiskFlags,
                hardEligibilityFlags,
                terminologyMismatchCount: matrixResult.terminologyMismatchCount,
                isClean,
                createdAt: now,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: preflightChecks.id,
                set: {
                    atsSafetyScore,
                    evidenceCoverageScore,
                    parsingRiskFlags,
                    hardEligibilityFlags,
                    terminologyMismatchCount: matrixResult.terminologyMismatchCount,
                    isClean,
                    updatedAt: now,
                },
            });
    }

    return report;
}
