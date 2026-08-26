export type CapabilityStatus = "available" | "limited" | "hidden";

export interface ProductCapability {
    id: string;
    status: CapabilityStatus;
    entitlement: "authenticated" | "credits" | "public" | "support";
    route: string | null;
    owner: "applications" | "resumes" | "portfolio" | "platform";
    evidence: string;
    userLanguage: string;
}

/**
 * Authoritative product exposure registry. UI copy must not promise more than
 * the implementation and verification recorded here.
 */
export const PRODUCT_CAPABILITIES = {
    resumePdfExport: {
        id: "resume-pdf-export",
        status: "available",
        entitlement: "authenticated",
        route: "/api/export/pdf",
        owner: "resumes",
        evidence: "tests/pdf-security.test.ts",
        userLanguage: "Export PDF",
    },
    compilerTextExport: {
        id: "compiler-text-export",
        status: "available",
        entitlement: "authenticated",
        route: "/api/applications/[id]/matrix",
        owner: "applications",
        evidence: "tests/evidence-compiler.test.ts",
        userLanguage: "Export text",
    },
    docxExport: {
        id: "docx-export",
        status: "hidden",
        entitlement: "authenticated",
        route: null,
        owner: "resumes",
        evidence: "No DOCX renderer is implemented",
        userLanguage: "",
    },
    publicPortfolio: {
        id: "public-portfolio",
        status: "available",
        entitlement: "public",
        route: "/p/[slug]",
        owner: "portfolio",
        evidence: "tests/portfolio-privacy.test.ts",
        userLanguage: "Published portfolio",
    },
    accountDeletion: {
        id: "account-deletion",
        status: "limited",
        entitlement: "support",
        route: null,
        owner: "platform",
        evidence: "Retention workflow requires support review",
        userLanguage: "Contact support to request account deletion",
    },
    zebuWorkspaceWrites: {
        id: "zebu-workspace-writes",
        status: "hidden",
        entitlement: "authenticated",
        route: null,
        owner: "platform",
        evidence: "tests/zebu-contract.test.ts",
        userLanguage: "",
    },
} as const satisfies Record<string, ProductCapability>;

export function isCapabilityExposed(capability: ProductCapability): boolean {
    return capability.status !== "hidden";
}
