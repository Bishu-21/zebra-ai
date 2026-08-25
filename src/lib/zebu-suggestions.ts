const suggestions: Record<string, string[]> = {
  "/dashboard": ["What should I work on next?", "Show my deadlines", "How many applications are active?"],
  "/dashboard/resumes": ["Analyze my latest resume", "Find my frontend resume", "Open my most recent resume"],
  "/dashboard/job-tracker": ["Find my latest application", "Any deadlines this week?", "Show active applications"],
  "/dashboard/work": ["Summarize my projects", "Find work that shows React", "What should I improve next?"],
  "/dashboard/portfolio": ["Is my portfolio published?", "What's missing from my portfolio?", "Summarize my projects"],
  "/dashboard/settings": ["Show my workspace stats", "What can you help me with?"],
};

export function getZebuSuggestions(pathname: string): string[] {
  const exact = suggestions[pathname];
  if (exact) return exact;
  const parent = Object.keys(suggestions).find((path) => path !== "/dashboard" && pathname.startsWith(`${path}/`));
  return suggestions[parent ?? "/dashboard"];
}
