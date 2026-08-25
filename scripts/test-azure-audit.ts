import dotenv from "dotenv";
import { generateAiResponse } from "../src/lib/azure-foundry";
import { extractJsonObject } from "../src/lib/resume-ingestion";
import { aiResumeAnalysisSchema } from "../src/lib/validation";
import {
    calculateResumeAuditScores,
    formatResumeAuditRubricForPrompt,
    normalizeResumeQualityAuditItems,
    RESUME_AUDIT_RESPONSE_FORMAT,
    RESUME_AUDIT_RUBRIC,
} from "../src/lib/resume-audit-rubric";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// This is specifically an Azure smoke test. Do not let a configured fallback
// conceal an Azure response-shaping or deployment failure.
delete process.env.GEMINI_API_KEY;

const sampleResume = `
Bishal Sarkar
Software Engineer
Built and shipped a TypeScript resume workflow backed by PostgreSQL.
Improved release reliability by adding migration and production-build checks.
Skills: TypeScript, Next.js, PostgreSQL, Azure AI Foundry
`;

const prompt = `Audit the resume evidence below against all 45 rubric checks and return one JSON object.

Return each ID exactly once in its declared category. Applicable text checks may be Pass, Partial, or Fail. Target-dependent checks are Not Applicable because no target was supplied. Rendered and external checks are Not Assessed. Never invent evidence.

RUBRIC:
${formatResumeAuditRubricForPrompt()}

Return exactly this shape:
{
  "score": 0,
  "summary": "evidence-based overview",
  "metrics": { "impact": 0, "formatting": 0, "ats": 0, "branding": 0 },
  "audit": { "document": [{ "id": "DOC-01", "checkpoint": "exact rubric text", "status": "Pass|Partial|Fail|Not Applicable|Not Assessed", "fix": "...", "evidence": "..." }], "contact": [], "targeting": [], "experience": [], "projects": [], "skillsEducation": [], "writing": [] },
  "recruiterInsights": { "sevenSecondScan": "...", "soWhatTest": "...", "readability": "..." },
  "suggestedBulletPoints": [{ "original": "exact source text", "problem": "...", "after": "evidence-safe rewrite", "rationale": "..." }]
}

RESUME EVIDENCE START
${sampleResume}
RESUME EVIDENCE END`;

async function main() {
    const response = await generateAiResponse({
        task: "audit",
        systemPrompt: "You are an evidence-grounded resume auditor. Output strict JSON only.",
        prompt,
        responseFormat: RESUME_AUDIT_RESPONSE_FORMAT,
    });
    const analysis = aiResumeAnalysisSchema.parse(extractJsonObject(response));
    const items = Object.values(analysis.audit).flat();
    const ids = new Set(items.map((item) => item.id));
    if (items.length !== RESUME_AUDIT_RUBRIC.length || ids.size !== RESUME_AUDIT_RUBRIC.length) {
        throw new Error(`Expected 45 unique checks, received ${items.length} items and ${ids.size} IDs`);
    }
    const calculated = calculateResumeAuditScores(normalizeResumeQualityAuditItems(items));
    console.log("Azure audit smoke passed.");
    console.log(`Calculated score: ${calculated.overall}`);
    console.log(`Rubric checks: ${items.length}`);
    console.log(`Audit categories: ${Object.keys(analysis.audit).length}`);
    console.log(`Suggested rewrites: ${analysis.suggestedBulletPoints.length}`);
}

main().catch((error: unknown) => {
    console.error("Azure audit smoke failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
