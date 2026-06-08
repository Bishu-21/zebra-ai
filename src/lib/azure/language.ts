import { TextAnalysisClient, AzureKeyCredential } from "@azure/ai-language-text";

const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT || "";
const apiKey = process.env.AZURE_LANGUAGE_KEY || "";

export const isAzureConfigured = !!(endpoint && apiKey);

export interface JobIntelligence {
    keyPhrases: string[];
    entities: {
        text: string;
        category: string;
        subCategory?: string;
        confidenceScore: number;
    }[];
    skills: string[];
    companySignals: string[];
    requirements: string[];
}

export async function extractJobIntelligence(text: string): Promise<JobIntelligence | null> {
    if (!isAzureConfigured) return null;

    try {
        const client = new TextAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
        
        const actions = [
            { kind: "KeyPhraseExtraction" as const },
            { kind: "EntityRecognition" as const },
        ];

        const poller = await client.beginAnalyzeBatch(actions, [text], "en");
        const results = await poller.pollUntilDone();

        const keyPhrases: string[] = [];
        const entities: JobIntelligence["entities"] = [];
        const skills: string[] = [];
        const companySignals: string[] = [];
        const requirements: string[] = [];

        // Correct iteration for Azure SDK Paged results
        for await (const page of results) {
            const pageData = page as unknown as {
                actions?: {
                    kind: string;
                    results: {
                        error?: unknown;
                        keyPhrases?: string[];
                        entities?: {
                            text: string;
                            category: string;
                            subCategory?: string;
                            confidenceScore: number;
                        }[];
                    }[];
                }[];
            };
            const actions = pageData.actions;
            if (!actions) continue;

            for (const action of actions) {
                if (action.kind === "KeyPhraseExtraction") {
                    action.results.forEach((res) => {
                        if (!res.error && res.keyPhrases) {
                            keyPhrases.push(...res.keyPhrases);
                        }
                    });
                }
                if (action.kind === "EntityRecognition") {
                    action.results.forEach((res) => {
                        if (!res.error && res.entities) {
                            res.entities.forEach((entity) => {
                                entities.push({
                                    text: entity.text,
                                    category: entity.category,
                                    subCategory: entity.subCategory,
                                    confidenceScore: entity.confidenceScore
                                });

                                // Basic mapping logic
                                if (entity.category === "Skill" || entity.category === "Product") {
                                    skills.push(entity.text);
                                }
                                if (entity.category === "Organization") {
                                    companySignals.push(entity.text);
                                }
                            });
                        }
                    });
                }
            }
        }

        // Logic for requirements: Filter key phrases that look like requirements or are high priority
        // For now, we'll take the first few key phrases as potential requirements if they contain action verbs or specific nouns
        // (This is a simplification, but fits the "intelligence" extraction goal)
        requirements.push(...keyPhrases.filter(phrase => 
            phrase.toLowerCase().includes("experience") || 
            phrase.toLowerCase().includes("years") ||
            phrase.toLowerCase().includes("ability to") ||
            phrase.toLowerCase().includes("proficiency")
        ).slice(0, 10));

        return {
            keyPhrases: Array.from(new Set(keyPhrases)),
            entities: entities,
            skills: Array.from(new Set(skills)),
            companySignals: Array.from(new Set(companySignals)),
            requirements: Array.from(new Set(requirements))
        };
    } catch (error) {
        console.error("Azure AI Language extraction failed:", error);
        return null;
    }
}
