const stringArray = {
    type: "array",
    items: { type: "string" },
} as const;

export const ROLE_MATCH_RESPONSE_FORMAT = {
    type: "json_schema" as const,
    name: "zebra_role_match",
    strict: true,
    schema: {
        type: "object",
        additionalProperties: false,
        required: [
            "matchScore",
            "keywordsFound",
            "keywordsMissing",
            "roleFit",
            "criticalGaps",
            "tailoringSuggestions",
            "executiveSummary",
            "sectionChanges",
        ],
        properties: {
            matchScore: { type: "number", minimum: 0, maximum: 100 },
            keywordsFound: stringArray,
            keywordsMissing: stringArray,
            roleFit: { type: "string" },
            criticalGaps: stringArray,
            tailoringSuggestions: stringArray,
            executiveSummary: { type: "string" },
            sectionChanges: {
                type: "array",
                maxItems: 12,
                items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["section", "changeType", "originalText", "suggestedText", "reason"],
                    properties: {
                        section: { type: "string", enum: ["Summary", "Experience", "Skills", "Projects", "Education", "General"] },
                        changeType: { type: "string", enum: ["add", "modify", "remove", "rewrite"] },
                        originalText: { type: "string" },
                        suggestedText: { type: "string" },
                        reason: { type: "string" },
                    },
                },
            },
        },
    },
};
