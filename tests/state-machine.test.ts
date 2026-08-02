import { test, describe } from "node:test";
import assert from "node:assert";
import { 
    validateStatusTransition, 
    isValidApplicationStatus,
    ApplicationStatus
} from "../src/lib/application-state-machine";
import { BOARD_STATUSES } from "../src/components/dashboard/JobBoard";

describe("Application State Machine Test Suite [Unit Test]", () => {

    test("1. Canonical status validation", () => {
        const validStatuses = [
            "Draft", "Preparing", "Ready", "Applied", 
            "Interviewing", "Offer", "Rejected", "Withdrawn"
        ];

        for (const status of validStatuses) {
            assert.strictEqual(isValidApplicationStatus(status), true, `Expected "${status}" to be valid`);
        }

        const invalidStatuses = ["Tailoring", "Pending", "InReview", "Hired", "Denied", "random_string"];
        for (const status of invalidStatuses) {
            assert.strictEqual(isValidApplicationStatus(status), false, `Expected "${status}" to be invalid`);
        }
    });

    test("2. Prerequisites for Draft, Preparing, Ready, and Applied", () => {
        // Missing company/position
        const noDetails = validateStatusTransition(null, "Draft", { company: "", position: "" });
        assert.strictEqual(noDetails.valid, false);
        assert.match(noDetails.error!, /requires both company and position/);

        // Draft with details passes
        const validDraft = validateStatusTransition(null, "Draft", { company: "Google", position: "Software Engineer" });
        assert.strictEqual(validDraft.valid, true);

        // Preparing requires attached resume
        const prepNoResume = validateStatusTransition(null, "Preparing", { company: "Google", position: "SE" });
        assert.strictEqual(prepNoResume.valid, false);
        assert.match(prepNoResume.error!, /requires an attached resume/);

        const prepWithResume = validateStatusTransition(null, "Preparing", { company: "Google", position: "SE", selectedResumeId: "res-123" });
        assert.strictEqual(prepWithResume.valid, true);

        // Ready requires resume or tailored version
        const readyNoResume = validateStatusTransition(null, "Ready", { company: "Google", position: "SE" });
        assert.strictEqual(readyNoResume.valid, false);
        assert.match(readyNoResume.error!, /requires a usable tailored version/);

        const readyWithVersion = validateStatusTransition(null, "Ready", { company: "Google", position: "SE", resumeVersionId: "ver-123" });
        assert.strictEqual(readyWithVersion.valid, true);

        // Applied requires attached resume
        const appliedNoResume = validateStatusTransition(null, "Applied", { company: "Google", position: "SE" });
        assert.strictEqual(appliedNoResume.valid, false);
        assert.match(appliedNoResume.error!, /requires a selected resume or resume version/);
    });

    test("3. Valid State Progression Flow", () => {
        const appData = {
            company: "Stripe",
            position: "Backend Engineer",
            selectedResumeId: "res-456",
            resumeVersionId: "ver-789",
        };

        // Draft -> Preparing
        let res = validateStatusTransition("Draft", "Preparing", appData);
        assert.strictEqual(res.valid, true);

        // Preparing -> Ready
        res = validateStatusTransition("Preparing", "Ready", appData);
        assert.strictEqual(res.valid, true);

        // Ready -> Applied
        res = validateStatusTransition("Ready", "Applied", appData);
        assert.strictEqual(res.valid, true);

        // Applied -> Interviewing
        res = validateStatusTransition("Applied", "Interviewing", appData);
        assert.strictEqual(res.valid, true);

        // Interviewing -> Offer
        res = validateStatusTransition("Interviewing", "Offer", appData);
        assert.strictEqual(res.valid, true);
    });

    test("4. Invalid Transition: Shortcut to Interviewing without being Applied", () => {
        const appData = {
            company: "Meta",
            position: "Product Manager",
            selectedResumeId: "res-123",
        };

        // Draft -> Interviewing should FAIL
        const draftToInterviewing = validateStatusTransition("Draft", "Interviewing", appData);
        assert.strictEqual(draftToInterviewing.valid, false);
        assert.match(draftToInterviewing.error!, /must be in "Applied" status first/);

        // Ready -> Interviewing should FAIL
        const readyToInterviewing = validateStatusTransition("Ready", "Interviewing", appData);
        assert.strictEqual(readyToInterviewing.valid, false);
        assert.match(readyToInterviewing.error!, /must be in "Applied" status first/);
    });

    test("5. Invalid Transition: Direct creation in Interviewing, Offer, or Rejected", () => {
        const appData = { company: "Apple", position: "iOS Dev", selectedResumeId: "res-999" };

        const createInterviewing = validateStatusTransition(null, "Interviewing", appData);
        assert.strictEqual(createInterviewing.valid, false);

        const createOffer = validateStatusTransition(null, "Offer", appData);
        assert.strictEqual(createOffer.valid, false);

        const createRejected = validateStatusTransition(null, "Rejected", appData);
        assert.strictEqual(createRejected.valid, false);
    });

    test("6. Terminal State Lockout Rules", () => {
        const appData = { company: "Netflix", position: "UI Dev", selectedResumeId: "res-111" };
        const terminalStates: ApplicationStatus[] = ["Offer", "Rejected", "Withdrawn"];
        const targetStates: ApplicationStatus[] = ["Draft", "Preparing", "Ready", "Applied", "Interviewing"];

        for (const terminal of terminalStates) {
            for (const target of targetStates) {
                const res = validateStatusTransition(terminal, target, appData);
                assert.strictEqual(res.valid, false, `Expected transition from ${terminal} to ${target} to fail`);
                assert.match(res.error!, /terminal status/);
            }
        }
    });

    test("7. Arbitrary Invalid Status Strings Are Blocked", () => {
        const appData = { company: "Amazon", position: "SDE-II", selectedResumeId: "res-222" };
        const res = validateStatusTransition("Applied", "SuperHired", appData);
        assert.strictEqual(res.valid, false);
        assert.match(res.error!, /Invalid application status: "SuperHired"/);
    });

    test("8. Transition to Withdrawn from Any Non-Terminal State", () => {
        const appData = { company: "Uber", position: "Data Scientist", selectedResumeId: "res-333" };
        const activeStates: ApplicationStatus[] = ["Draft", "Preparing", "Ready", "Applied", "Interviewing"];

        for (const state of activeStates) {
            const res = validateStatusTransition(state, "Withdrawn", appData);
            assert.strictEqual(res.valid, true, `Expected transition from ${state} to Withdrawn to succeed`);
        }
    });

    test("9. JobBoard BOARD_STATUSES includes all required canonical statuses without collapsing", () => {
        const requiredStatuses = [
            "Draft", "Preparing", "Tailoring", "Applied",
            "Interviewing", "Offer", "Rejected", "Withdrawn"
        ];

        for (const status of requiredStatuses) {
            assert.ok(
                BOARD_STATUSES.includes(status as typeof BOARD_STATUSES[number]),
                `BOARD_STATUSES must explicitly support "${status}"`
            );
        }
    });
});
