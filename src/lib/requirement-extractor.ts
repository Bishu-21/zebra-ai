/**
 * Deterministic Job Requirement & Tech Skill Extractor
 * Extracts skills, technologies, and job requirements from job descriptions cleanly.
 */

export interface KnownRequirement {
    canonical: string;
    aliases: string[];
    useWordBoundary?: boolean;
}

export const KNOWN_REQUIREMENTS: KnownRequirement[] = [
    { canonical: "React", aliases: ["react", "react.js", "reactjs"] },
    { canonical: "Next.js", aliases: ["next.js", "nextjs", "next"] },
    { canonical: "TypeScript", aliases: ["typescript", "ts"] },
    { canonical: "JavaScript", aliases: ["javascript", "js", "ecmascript"] },
    { canonical: "Node.js", aliases: ["node.js", "nodejs", "node"] },
    { canonical: "Python", aliases: ["python", "python3", "py"] },
    { canonical: "Java", aliases: ["java"], useWordBoundary: true },
    { canonical: "Go", aliases: ["go", "golang"], useWordBoundary: true },
    { canonical: "C++", aliases: ["c++", "cpp"] },
    { canonical: "C#", aliases: ["c#", "csharp", ".net"] },
    { canonical: "GraphQL", aliases: ["graphql"] },
    { canonical: "REST API", aliases: ["rest", "restful", "rest api", "rest apis"] },
    { canonical: "SQL", aliases: ["sql", "mysql", "t-sql"] },
    { canonical: "PostgreSQL", aliases: ["postgresql", "postgres"] },
    { canonical: "MongoDB", aliases: ["mongodb", "mongo"] },
    { canonical: "Redis", aliases: ["redis"] },
    { canonical: "AWS", aliases: ["aws", "amazon web services"] },
    { canonical: "Azure", aliases: ["azure", "azure cloud"] },
    { canonical: "GCP", aliases: ["gcp", "google cloud", "google cloud platform"] },
    { canonical: "Docker", aliases: ["docker"] },
    { canonical: "Kubernetes", aliases: ["kubernetes", "k8s"] },
    { canonical: "CI/CD", aliases: ["ci/cd", "cicd", "continuous integration", "github actions"] },
    { canonical: "Tailwind CSS", aliases: ["tailwind", "tailwindcss", "tailwind css"] },
    { canonical: "System Design", aliases: ["system design", "distributed systems", "software architecture"] },
    { canonical: "Agile", aliases: ["agile", "scrum", "kanban"] },
    { canonical: "Microservices", aliases: ["microservices", "microservice", "microservice architecture"] },
    { canonical: "Git", aliases: ["git", "github", "gitlab", "bitbucket"] },
    { canonical: "Redux", aliases: ["redux", "redux toolkit", "rtk"] },
    { canonical: "Testing", aliases: ["testing", "unit testing", "integration testing", "e2e testing", "tdd"] },
    { canonical: "Jest", aliases: ["jest", "vitest", "cypress", "playwright"] },
    { canonical: "Vue.js", aliases: ["vue", "vue.js", "vuejs"] },
    { canonical: "Angular", aliases: ["angular", "angularjs"] },
    { canonical: "Express.js", aliases: ["express", "express.js", "expressjs"] },
    { canonical: "Django", aliases: ["django"] },
    { canonical: "Flask", aliases: ["flask"] },
    { canonical: "Spring Boot", aliases: ["spring", "spring boot"] },
    { canonical: "Ruby on Rails", aliases: ["ruby", "rails", "ruby on rails"] },
    { canonical: "DevOps", aliases: ["devops"] },
    { canonical: "Terraform", aliases: ["terraform"] },
    { canonical: "Kafka", aliases: ["kafka", "apache kafka"] },
    { canonical: "HTML", aliases: ["html", "html5"] },
    { canonical: "CSS", aliases: ["css", "css3"] },
    { canonical: "Sass", aliases: ["sass", "scss"] },
    { canonical: "Vite", aliases: ["vite", "vitejs", "webpack"] },
    { canonical: "ORM", aliases: ["prisma", "drizzle", "sequelize", "typeorm"] },
];

/**
 * Escapes regex special characters in a string.
 */
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes text input safely by stripping markdown format characters and whitespace.
 */
export function normalizeJobText(text: string | null | undefined): string {
    if (!text) return "";
    return text
        .trim()
        .replace(/[*_#`~\[\]()]/g, " ")
        .replace(/\s+/g, " ");
}

/**
 * Deterministically extracts requirements and tech skills from a job description.
 *
 * @param jobDescription Raw or formatted job description text
 * @returns Array of unique, canonical requirement strings
 */
export function extractJobRequirements(jobDescription: string | null | undefined): string[] {
    const cleanText = normalizeJobText(jobDescription);
    if (!cleanText) return [];

    const lowerText = cleanText.toLowerCase();
    const foundCanonicalSet = new Set<string>();
    const foundRequirements: string[] = [];

    // 1. Match known technical terms & skills
    for (const req of KNOWN_REQUIREMENTS) {
        for (const alias of req.aliases) {
            const aliasLower = alias.toLowerCase();
            const escaped = escapeRegExp(aliasLower);

            const pattern = (req.useWordBoundary || aliasLower.length <= 4)
                ? new RegExp(`\\b${escaped}\\b`, "i")
                : new RegExp(escaped, "i");

            if (pattern.test(lowerText)) {
                if (!foundCanonicalSet.has(req.canonical.toLowerCase())) {
                    foundCanonicalSet.add(req.canonical.toLowerCase());
                    foundRequirements.push(req.canonical);
                }
                break;
            }
        }
    }

    // 2. Extract bullet points / requirement lines starting with action/requirement markers
    const lines = cleanText.split(/\r?\n|[.;]/);
    for (const line of lines) {
        const trimmed = line.trim();
        const reqMatch = trimmed.match(/^(?:must have|requirements?|qualifications?|proficiency in|experience with|knowledge of)\s*[:\-]\s*(.+)$/i);
        if (reqMatch && reqMatch[1]) {
            const phrase = reqMatch[1].trim();
            if (phrase.length > 2 && phrase.length < 50) {
                const normPhraseKey = phrase.toLowerCase();
                if (!foundCanonicalSet.has(normPhraseKey)) {
                    foundCanonicalSet.add(normPhraseKey);
                    const displayPhrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
                    foundRequirements.push(displayPhrase);
                }
            }
        }
    }

    return foundRequirements;
}

/**
 * Result structure preserving the exact UI contract of evidenceAnalysis in ApplicationWorkspace.tsx.
 */
export interface EvidenceAnalysisResult {
    requirements: string[];
    covered: string[];
    missing: string[];
    unattachedRecommendations: Array<{
        req: string;
        itemTitle: string;
        itemId: string;
    }>;
}

export interface WorkItemForAnalysis {
    id: string;
    title: string;
    description?: string | null;
}

/**
 * Analyzes evidence coverage of extracted job requirements against user's attached work items
 * and selected master resume.
 */
export function analyzeEvidenceCoverage(
    jobDescription: string | null | undefined,
    selectedWorkIds: string[],
    workItems: WorkItemForAnalysis[],
    selectedResume?: { title?: string | null; content?: string | null } | null
): EvidenceAnalysisResult {
    const requirements = extractJobRequirements(jobDescription);
    if (requirements.length === 0) {
        return { requirements: [], covered: [], missing: [], unattachedRecommendations: [] };
    }

    const attachedWork = workItems.filter(w => selectedWorkIds.includes(w.id));
    const unattachedWork = workItems.filter(w => !selectedWorkIds.includes(w.id));

    const covered: string[] = [];
    const missing: string[] = [];
    const unattachedRecommendations: Array<{ req: string; itemTitle: string; itemId: string }> = [];

    const resumeText = `${selectedResume?.title || ""} ${selectedResume?.content || ""}`.toLowerCase();

    for (const req of requirements) {
        const reqLower = req.toLowerCase();

        const isCoveredInWork = attachedWork.some(w =>
            (w.title && w.title.toLowerCase().includes(reqLower)) ||
            (w.description && w.description.toLowerCase().includes(reqLower))
        );

        const isCoveredInResume = resumeText.includes(reqLower);

        if (isCoveredInWork || isCoveredInResume) {
            covered.push(req);
        } else {
            missing.push(req);
            const matchingUnattached = unattachedWork.find(w =>
                (w.title && w.title.toLowerCase().includes(reqLower)) ||
                (w.description && w.description.toLowerCase().includes(reqLower))
            );
            if (matchingUnattached) {
                unattachedRecommendations.push({
                    req,
                    itemTitle: matchingUnattached.title,
                    itemId: matchingUnattached.id,
                });
            }
        }
    }

    return {
        requirements,
        covered,
        missing,
        unattachedRecommendations,
    };
}
