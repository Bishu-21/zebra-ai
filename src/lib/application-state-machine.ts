import { APPLICATION_STATUSES } from "@/lib/validation";

export { APPLICATION_STATUSES };
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationStateData {
    company?: string | null;
    position?: string | null;
    selectedResumeId?: string | null;
    resumeVersionId?: string | null;
}

export type TransitionResult =
    | { valid: true; error: null }
    | { valid: false; error: string };

const TERMINAL_STATUSES: Set<ApplicationStatus> = new Set([
    "Offer",
    "Rejected",
    "Withdrawn",
]);

const ACTIVE_STATUSES: Set<ApplicationStatus> = new Set([
    "Draft",
    "Preparing",
    "Ready",
    "Applied",
    "Interviewing",
]);

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, Set<ApplicationStatus>> = {
    Draft: new Set(["Draft", "Preparing", "Ready", "Applied", "Offer", "Rejected", "Withdrawn"]),
    Preparing: new Set(["Draft", "Preparing", "Ready", "Applied", "Offer", "Rejected", "Withdrawn"]),
    Ready: new Set(["Draft", "Preparing", "Ready", "Applied", "Offer", "Rejected", "Withdrawn"]),
    Applied: new Set(["Preparing", "Ready", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"]),
    Interviewing: new Set(["Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"]),
    Offer: new Set(),
    Rejected: new Set(),
    Withdrawn: new Set(),
};

/**
 * Validate that a target status string is a valid canonical status.
 */
export function isValidApplicationStatus(status: string): status is ApplicationStatus {
    return (APPLICATION_STATUSES as readonly string[]).includes(status);
}

/**
 * Validate status transition and minimum rule requirements for an application.
 */
export function validateStatusTransition(
    currentStatus: ApplicationStatus | null | undefined,
    targetStatus: string,
    data: ApplicationStateData
): TransitionResult {
    // 1. Check if target status is a valid canonical status
    if (!isValidApplicationStatus(targetStatus)) {
        return {
            valid: false,
            error: `Invalid application status: "${targetStatus}". Must be one of: ${APPLICATION_STATUSES.join(", ")}`,
        };
    }

    const company = data.company?.trim();
    const position = data.position?.trim();
    const hasAttachedResume = Boolean(data.selectedResumeId || data.resumeVersionId);

    // 2. Prerequisites for specific target states
    if (targetStatus === "Draft") {
        if (!company || !position) {
            return {
                valid: false,
                error: "Draft status requires both company and position to be specified.",
            };
        }
    }

    if (targetStatus === "Preparing") {
        if (!company || !position) {
            return {
                valid: false,
                error: "Preparing status requires company and position.",
            };
        }
        if (!hasAttachedResume) {
            return {
                valid: false,
                error: "Preparing status requires an attached resume or resume version.",
            };
        }
    }

    if (targetStatus === "Ready") {
        if (!company || !position) {
            return {
                valid: false,
                error: "Ready status requires company and position.",
            };
        }
        if (!hasAttachedResume) {
            return {
                valid: false,
                error: "Ready status requires a usable tailored version or reviewed base resume.",
            };
        }
    }

    if (targetStatus === "Applied") {
        if (!company || !position) {
            return {
                valid: false,
                error: "Applied status requires company and position.",
            };
        }
        if (!hasAttachedResume) {
            return {
                valid: false,
                error: "Applied status requires a selected resume or resume version.",
            };
        }
    }

    // 3. Handle status transitions from existing currentStatus
    if (currentStatus) {
        if (currentStatus === targetStatus) {
            return { valid: true, error: null };
        }

        // Terminal state lockouts
        if (TERMINAL_STATUSES.has(currentStatus)) {
            return {
                valid: false,
                error: `Cannot transition application from terminal status "${currentStatus}" to "${targetStatus}".`,
            };
        }

        // Specific rule: Interviewing requires application to have been marked Applied
        if (targetStatus === "Interviewing" && currentStatus !== "Applied") {
            return {
                valid: false,
                error: `Invalid transition to "Interviewing". Application must be in "Applied" status first (current status: "${currentStatus}").`,
            };
        }

        // Specific rule: Offer & Rejected must come from an active application state
        if ((targetStatus === "Offer" || targetStatus === "Rejected") && !ACTIVE_STATUSES.has(currentStatus)) {
            return {
                valid: false,
                error: `Cannot change status to "${targetStatus}" from inactive status "${currentStatus}".`,
            };
        }

        // Check allowed transition set
        const allowed = ALLOWED_TRANSITIONS[currentStatus];
        if (!allowed || !allowed.has(targetStatus)) {
            return {
                valid: false,
                error: `Invalid status transition from "${currentStatus}" to "${targetStatus}".`,
            };
        }
    } else {
        // Initial creation validation (currentStatus is null/undefined)
        if (targetStatus === "Interviewing") {
            return {
                valid: false,
                error: 'Cannot create application directly in "Interviewing" status. It must be created and marked "Applied" first.',
            };
        }
        if (targetStatus === "Offer" || targetStatus === "Rejected") {
            return {
                valid: false,
                error: `Cannot create application directly in terminal status "${targetStatus}".`,
            };
        }
    }

    return { valid: true, error: null };
}
