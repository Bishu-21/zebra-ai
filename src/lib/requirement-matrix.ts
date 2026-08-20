import { extractJobRequirements } from "@/lib/requirement-extractor";
import { CandidateEvidenceNode } from "@/lib/evidence-graph";
import { db } from "@/lib/db";
import { jobRequirementMatrices } from "@/lib/schema";
import { testStore } from "@/lib/test-store";
import { isTestStoreActive } from "@/lib/auth-policy";

export interface MatrixItem {
    id: string;
    applicationId: string;
    userId: string;
    requirementKey: string;
    canonicalRequirement: string;
    classification: "Must-have" | "Preferred" | "Knockout";
    candidateEvidence: string;
    resultStatus: "Supported" | "Gap" | "Supported synonym" | "Ask candidate";
    requirementCategory: "hard_eligibility" | "tech_skill" | "domain_experience" | "soft_skill";
    evidenceNodeId: string | null;
    matchStatus: "exact_match" | "terminology_mismatch" | "weak_evidence" | "missing_evidence";
    confidenceScore: number;
    suggestedPhrasing: string | null;
    candidatePrompt: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface RequirementMatrixResult {
    applicationId: string;
    items: MatrixItem[];
    exactMatchCount: number;
    terminologyMismatchCount: number;
    weakEvidenceCount: number;
    missingEvidenceCount: number;
    overallMatchPercentage: number;
}

// Synonyms dictionary for terminology mismatch detection
const SYNONYMS: Record<string, string[]> = {
    "react": ["reactjs", "react.js", "frontend react"],
    "next.js": ["nextjs", "next", "react framework"],
    "typescript": ["ts", "typed javascript"],
    "javascript": ["js", "ecmascript"],
    "node.js": ["nodejs", "express", "backend js"],
    "rest api": ["api development", "restful services", "web apis", "rest apis", "restful api"],
    "sql": ["database", "postgresql", "mysql", "relational database"],
    "postgresql": ["postgres", "neon postgres", "neon", "psql", "sql"],
    "testing": ["unit testing", "jest", "cypress", "e2e testing", "qa"],
    "ci/cd": ["continuous integration", "github actions", "devops pipeline"],
};

/**
 * Classifies a requirement into Must-have, Preferred, or Knockout based on context.
 */
function classifyRequirement(req: string, jobDescription?: string | null): "Must-have" | "Preferred" | "Knockout" {
    const reqLower = req.toLowerCase();
    const jdLower = (jobDescription || "").toLowerCase();

    // 1. Knockout rule detection
    if (
        reqLower.includes("work authorization") ||
        reqLower.includes("citizenship") ||
        reqLower.includes("clearance") ||
        reqLower.includes("visa") ||
        reqLower.includes("degree") ||
        reqLower.includes("location")
    ) {
        return "Knockout";
    }

    // Check surrounding text in JD for Preferred / Nice to have markers
    const prefRegex = new RegExp(`(?:preferred|nice to have|plus|bonus|optional).*${reqLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    if (prefRegex.test(jdLower)) {
        return "Preferred";
    }

    return "Must-have";
}

/**
 * Builds the Requirement-to-Evidence Matrix for a given job application.
 * Evaluates extracted job requirements against the candidate's evidence graph.
 */
export async function buildRequirementMatrix(
    userId: string,
    applicationId: string,
    jobDescription: string | null | undefined,
    evidenceGraph: CandidateEvidenceNode[]
): Promise<RequirementMatrixResult> {
    const rawRequirements = extractJobRequirements(jobDescription);
    const now = new Date();

    const items: MatrixItem[] = [];
    let exactCount = 0;
    let termMismatchCount = 0;
    let weakCount = 0;
    let missingCount = 0;

    for (const req of rawRequirements) {
        const reqLower = req.toLowerCase();
        const reqKey = reqLower.replace(/[^a-z0-9]/g, "_");

        const classification = classifyRequirement(req, jobDescription);

        let matchedNode: CandidateEvidenceNode | null = null;
        let matchStatus: "exact_match" | "terminology_mismatch" | "weak_evidence" | "missing_evidence" = "missing_evidence";
        let candidateEvidence = "No evidence recorded";
        let resultStatus: "Supported" | "Gap" | "Supported synonym" | "Ask candidate" = "Ask candidate";
        let confidenceScore = 0;
        let suggestedPhrasing: string | null = null;
        let candidatePrompt: string | null = null;

        // 1. Direct match on skill or context
        const directMatch = evidenceGraph.find(node =>
            node.skill.toLowerCase() === reqLower ||
            node.companyOrProject.toLowerCase().includes(reqLower) ||
            node.action.toLowerCase().includes(reqLower)
        );

        if (directMatch) {
            matchedNode = directMatch;
            candidateEvidence = matchedNode.action 
                ? (matchedNode.action.length > 50 ? `${matchedNode.action.substring(0, 50)}...` : matchedNode.action)
                : `Used ${matchedNode.skill} at ${matchedNode.companyOrProject}`;

            if (matchedNode.action && matchedNode.measurableOutcome) {
                matchStatus = "exact_match";
                resultStatus = "Supported";
                confidenceScore = 95;
                suggestedPhrasing = `${matchedNode.action} using ${matchedNode.skill} at ${matchedNode.companyOrProject}, achieving ${matchedNode.measurableOutcome}.`;
                exactCount++;
            } else {
                matchStatus = "weak_evidence";
                resultStatus = "Gap";
                confidenceScore = 60;
                suggestedPhrasing = `${matchedNode.action} with ${matchedNode.skill} at ${matchedNode.companyOrProject}.`;
                candidatePrompt = `You have evidence for ${req} in ${matchedNode.companyOrProject}, but no measurable outcome. Did this result in performance improvements, user growth, or reduced bugs?`;
                weakCount++;
            }
        } else {
            // 2. Terminology mismatch check (synonym search)
            const synonyms = SYNONYMS[reqLower] || [];
            const synonymMatch = evidenceGraph.find(node => {
                const nodeSkillLower = node.skill.toLowerCase();
                const nodeActionLower = node.action.toLowerCase();
                return synonyms.some(syn => nodeSkillLower.includes(syn) || nodeActionLower.includes(syn));
            });

            if (synonymMatch) {
                matchedNode = synonymMatch;
                matchStatus = "terminology_mismatch";
                resultStatus = "Supported synonym";
                candidateEvidence = `Used ${matchedNode.skill} at ${matchedNode.companyOrProject}`;
                confidenceScore = 80;
                suggestedPhrasing = `Utilized ${matchedNode.skill} (${req}) for ${matchedNode.action} at ${matchedNode.companyOrProject}${matchedNode.measurableOutcome ? `, resulting in ${matchedNode.measurableOutcome}` : ""}.`;
                candidatePrompt = `The job asks for "${req}". Your profile lists "${matchedNode.skill}". Zebra normalized terminology while keeping your real evidence intact.`;
                termMismatchCount++;
            } else {
                // 3. Missing evidence or Knockout unknown
                matchStatus = "missing_evidence";
                resultStatus = classification === "Knockout" ? "Ask candidate" : (classification === "Must-have" ? "Gap" : "Ask candidate");
                candidateEvidence = classification === "Knockout" ? "Unknown" : "No evidence recorded";
                confidenceScore = 0;
                candidatePrompt = classification === "Knockout" 
                    ? `This role specifies "${req}". Please confirm your status to ensure compliance.`
                    : `The job requires experience with "${req}". Zebra did not find relevant evidence in your profile. Have you built a project or used "${req}" in a role?`;
                missingCount++;
            }
        }

        const item: MatrixItem = {
            id: `mat_${applicationId}_${reqKey}`,
            applicationId,
            userId,
            requirementKey: reqKey,
            canonicalRequirement: req,
            classification,
            candidateEvidence,
            resultStatus,
            requirementCategory: classification === "Knockout" ? "hard_eligibility" : "tech_skill",
            evidenceNodeId: matchedNode ? matchedNode.id : null,
            matchStatus,
            confidenceScore,
            suggestedPhrasing,
            candidatePrompt,
            createdAt: now,
            updatedAt: now,
        };

        items.push(item);

        if (isTestStoreActive()) {
            testStore.jobRequirementMatrices.set(item.id, item);
        } else {
            await db.insert(jobRequirementMatrices)
                .values({
                    ...item,
                    createdAt: now,
                    updatedAt: now,
                })
                .onConflictDoUpdate({
                    target: jobRequirementMatrices.id,
                    set: {
                        evidenceNodeId: item.evidenceNodeId,
                        matchStatus: item.matchStatus,
                        confidenceScore: item.confidenceScore,
                        suggestedPhrasing: item.suggestedPhrasing,
                        candidatePrompt: item.candidatePrompt,
                        updatedAt: now,
                    },
                });
        }
    }

    const totalReqs = rawRequirements.length;
    const overallMatchPercentage = totalReqs > 0 ? Math.round(((exactCount + (termMismatchCount * 0.8) + (weakCount * 0.5)) / totalReqs) * 100) : 100;

    return {
        applicationId,
        items,
        exactMatchCount: exactCount,
        terminologyMismatchCount: termMismatchCount,
        weakEvidenceCount: weakCount,
        missingEvidenceCount: missingCount,
        overallMatchPercentage,
    };
}
