import type { BackgroundJobRecord } from "@/lib/background-ops";
import type { CandidateEvidenceNode } from "@/lib/evidence-graph";
import type { DocumentArtifactRecord } from "@/lib/document-storage";
import type { PreflightReport } from "@/lib/preflight-validator";
import type { MatrixItem } from "@/lib/requirement-matrix";

export interface TestUser {
    id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
}

export interface TestResume {
    id: string;
    userId: string;
    title: string;
    content: string;
    isPublic?: boolean;
    shareToken?: string | null;
}

export interface TestApplication {
    id: string;
    userId: string;
    company: string;
    position: string;
    jobDescription?: string | null;
    url?: string | null;
    status: string;
    selectedResumeId?: string | null;
    resumeVersionId?: string | null;
    selectedWorkIds?: string[] | null;
    selectedCertIds?: string[] | null;
    notes?: string | null;
    outcome?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestApplicationChange {
    id: string;
    applicationId: string;
    userId: string;
    section: string;
    changeType: string;
    originalText?: string | null;
    suggestedText: string;
    userEdits?: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}

export interface TestResumeVersion {
    id: string;
    userId: string;
    resumeId: string;
    title: string;
    company?: string | null;
    targetRole?: string | null;
    jobDescription?: string | null;
    content: string;
    feedback?: unknown;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestWorkItem {
    id: string;
    userId: string;
    title: string;
    category: string;
    description?: string | null;
    tools?: string[] | null;
    result?: string | null;
    proofUrl?: string | null;
}

export interface TestCertification {
    id: string;
    userId: string;
    name: string;
}

class IntegrationTestStore {
    users = new Map<string, TestUser>();
    resumes = new Map<string, TestResume>();
    applications = new Map<string, TestApplication>();
    applicationChanges = new Map<string, TestApplicationChange>();
    resumeVersions = new Map<string, TestResumeVersion>();
    workItems = new Map<string, TestWorkItem>();
    certifications = new Map<string, TestCertification>();
    evidenceNodes = new Map<string, CandidateEvidenceNode>();
    jobRequirementMatrices = new Map<string, MatrixItem>();
    preflightChecks = new Map<string, PreflightReport>();
    backgroundJobs = new Map<string, BackgroundJobRecord>();
    documentArtifacts = new Map<string, DocumentArtifactRecord>();

    clear() {
        this.users.clear();
        this.resumes.clear();
        this.applications.clear();
        this.applicationChanges.clear();
        this.resumeVersions.clear();
        this.workItems.clear();
        this.certifications.clear();
        this.evidenceNodes.clear();
        this.jobRequirementMatrices.clear();
        this.preflightChecks.clear();
        this.backgroundJobs.clear();
        this.documentArtifacts.clear();
    }
}

export const testStore = new IntegrationTestStore();
