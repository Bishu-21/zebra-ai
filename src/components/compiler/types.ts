// Prism-Style Resume Compiler — Domain Types

export interface SkillCategory {
    id: number;
    category: string;
    items: string; // comma-separated
}

export interface Achievement {
    id: number;
    category: string; // "Certifications", "Hackathons", etc.
    items: string; // semicolon-separated
}

export interface Experience {
    id: number;
    company: string;
    location?: string;
    role: string;
    period: string;
    highlights: string[];
    techStack?: string;
    link?: string;
}

export interface Project {
    id: number;
    title: string;
    techStack: string;
    link?: string;
    highlights: string[];
}

export interface Education {
    id: number;
    school: string;
    location?: string;
    degree: string;
    gpa?: string;
    period: string;
    highlights: string[];
}

export interface ResumeContent {
    basics: {
        name: string;
        email: string;
        phone: string;
        summary: string;
        location: string;
        linkedin?: string;
        portfolio?: string;
    };
    experience: Experience[];
    education: Education[];
    skills: SkillCategory[];
    projects: Project[];
    certifications: Achievement[];
}

export interface ResumeData {
    id: string;
    title: string;
    content: ResumeContent;
}

export interface RewriteItem {
    original?: string;
    problem?: string;
    after?: string;
    rationale?: string;
    suggestion?: string; // Fallback for legacy
}

export interface AuditItem {
    checkpoint?: string;
    message?: string;
    status?: "Pass" | "Fail";
    fix?: string;
}

export interface ResumeAnalysisData {
    score?: number;
    overallScore?: number;
    summary?: string;
    executiveSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
    actionItems?: string[];
    recommendations?: string[];
    audit?: Record<string, AuditItem[]>;
    suggestedBulletPoints?: RewriteItem[];
    intelligenceRewrites?: RewriteItem[];
    aiRewrites?: RewriteItem[];
    recruiterInsights?: {
        soWhatTest?: string;
        sevenSecondScan?: string;
        readability?: string;
    };
    metrics?: {
        impact?: number;
        formatting?: number;
        ats?: number;
        branding?: number;
    };
    // Tailoring-specific fields
    matchScore?: number;
    roleFit?: string;
    keywordsFound?: string[];
    keywordsMissing?: string[];
    tailoringSuggestions?: string[];
}

export type TemplateType = 'modern' | 'professional' | 'minimal' | 'executive';
export type SectionId = 'basics' | 'education' | 'skills' | 'projects' | 'experience' | 'certifications';
