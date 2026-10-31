import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
    buildLinkedInProfilePreview,
    combineLinkedInEvidence,
    formatWorkspaceWorkEvidence,
    validateLinkedInDrafts,
    type LinkedInDraft,
    type WorkspaceWorkEvidence,
} from "../src/lib/linkedin-workflow";

const work: WorkspaceWorkEvidence[] = [{
    id: "work-grants",
    title: "Accessible grants portal",
    category: "Project",
    description: "Built React forms with draft saving for civic grant applicants.",
    tools: ["TypeScript", "React"],
    result: "Applicants can save drafts and return without losing work.",
    proofUrl: "https://example.com/grants",
}];

const profile = "Headline: Frontend Developer. About: I build public-service interfaces.";

describe("LinkedIn review uses workspace work", () => {
    test("combines pasted profile text with saved work as evidence", () => {
        const combined = combineLinkedInEvidence(profile, work);
        assert.match(combined, /PROFILE|Frontend Developer/);
        assert.match(combined, /WORKSPACE WORK START/);
        assert.match(combined, /Accessible grants portal/);
        assert.match(formatWorkspaceWorkEvidence(work), /Applicants can save drafts/);
    });

    test("accepts a draft quoted from saved work rather than the LinkedIn paste", () => {
        const combined = combineLinkedInEvidence(profile, work);
        const drafts = validateLinkedInDrafts(combined, [{
            field: "experience",
            sourceQuote: "Built React forms with draft saving for civic grant applicants.",
            proposedText: "Built React forms with draft saving for civic grant applicants.",
            rationale: "Uses a workspace project as experience evidence.",
        }]);
        assert.equal(drafts.length, 1);
        assert.equal(drafts[0].field, "experience");
    });

    test("preview prefers accepted drafts and lists featured workspace work", () => {
        const drafts: LinkedInDraft[] = [{
            id: "headline-1",
            field: "headline",
            sourceQuote: "Frontend Developer",
            proposedText: "Frontend Developer | Civic products",
            rationale: "Adds domain.",
            status: "accepted",
            editedText: "Frontend Developer | Civic products",
        }];
        const preview = buildLinkedInProfilePreview({ drafts, workItems: work });
        assert.equal(preview.headline, "Frontend Developer | Civic products");
        assert.equal(preview.workItems[0]?.title, "Accessible grants portal");
    });

    test("audit, drafts, and the LinkedIn page load workspace work", () => {
        const auditRoute = readFileSync("src/app/api/ai/linkedin-audit/route.ts", "utf8");
        const draftsRoute = readFileSync("src/app/api/ai/linkedin-audit/[id]/drafts/route.ts", "utf8");
        const page = readFileSync("src/app/dashboard/linkedin/page.tsx", "utf8");
        const optimizer = readFileSync("src/components/dashboard/LinkedInOptimizer.tsx", "utf8");
        const results = readFileSync("src/components/dashboard/LinkedInAuditResults.tsx", "utf8");
        const store = readFileSync("src/lib/linkedin-audit-store.ts", "utf8");

        assert.match(auditRoute, /getWorkspaceWorkEvidence/);
        assert.match(auditRoute, /workEvidenceForReport/);
        assert.match(draftsRoute, /combineLinkedInEvidence/);
        assert.match(page, /initialProfileText = latest\?\.sourceText/);
        assert.match(page, /workItems=\{workItems\}/);
        assert.match(optimizer, /LinkedInProfilePreview/);
        assert.match(results, /Workspace work used in this report/);
        assert.match(store, /sourceText: linkedinAudits\.sourceText/);
    });
});
