export type ZebuSuggestion = {
  label: string;
  prompt: string;
  action?:
    | { type: "tool"; name: "get_quick_stats" | "get_deadlines" | "suggest_next_action" }
    | { type: "navigate"; route: string }
    | { type: "event"; name: "add_application"; route: "/dashboard/job-tracker" }
    | { type: "open_tool"; tool: "resume_analysis" | "role_match" };
};

const suggestions: Record<string, ZebuSuggestion[]> = {
  "/dashboard": [
    { label: "Plan my next step", prompt: "Based on my saved workspace, what should I work on next?", action: { type: "tool", name: "suggest_next_action" } },
    { label: "Check deadlines", prompt: "Show my upcoming application deadlines.", action: { type: "tool", name: "get_deadlines" } },
    { label: "Workspace totals", prompt: "Show my workspace stats.", action: { type: "tool", name: "get_quick_stats" } },
  ],
  "/dashboard/resumes": [
    { label: "Check a resume", prompt: "Open the resume analysis tool.", action: { type: "open_tool", tool: "resume_analysis" } },
    { label: "Match to a role", prompt: "Open the role matching tool.", action: { type: "open_tool", tool: "role_match" } },
    { label: "Find latest resume", prompt: "Find and open my most recently updated resume." },
  ],
  "/dashboard/job-tracker": [
    { label: "Check deadlines", prompt: "Show my upcoming application deadlines.", action: { type: "tool", name: "get_deadlines" } },
    { label: "Active applications", prompt: "Show my active applications." },
    { label: "Add application", prompt: "Help me add a new application draft.", action: { type: "event", name: "add_application", route: "/dashboard/job-tracker" } },
  ],
  "/dashboard/work": [
    { label: "Find strong work", prompt: "Find my strongest saved work." },
    { label: "Summarize projects", prompt: "Summarize my saved projects." },
    { label: "Add work", prompt: "Help me add a new work item." },
  ],
  "/dashboard/cover-letters": [
    { label: "Review my letters", prompt: "Show my saved cover letters." },
    { label: "Start a letter", prompt: "Take me to the cover letter creation flow.", action: { type: "navigate", route: "/dashboard/cover-letters" } },
    { label: "Find target role", prompt: "Find the application I should write a cover letter for next." },
  ],
  "/dashboard/portfolio": [
    { label: "Check publish state", prompt: "Is my portfolio currently published?" },
    { label: "Find missing proof", prompt: "What evidence is missing from my portfolio?" },
    { label: "Summarize projects", prompt: "Summarize my saved projects." },
  ],
  "/dashboard/analytics": [
    { label: "Workspace totals", prompt: "Show my workspace stats.", action: { type: "tool", name: "get_quick_stats" } },
    { label: "Active applications", prompt: "How many applications are currently active?" },
    { label: "Plan my next step", prompt: "Based on my workspace data, what should I do next?", action: { type: "tool", name: "suggest_next_action" } },
  ],
  "/dashboard/settings": [
    { label: "What Zebu can do", prompt: "Briefly list the workspace actions you can perform and your limits." },
    { label: "Workspace totals", prompt: "Show my workspace stats.", action: { type: "tool", name: "get_quick_stats" } },
    { label: "Check deadlines", prompt: "Show my upcoming application deadlines.", action: { type: "tool", name: "get_deadlines" } },
  ],
};

const pageLabels: Record<string, string> = {
  "/dashboard": "Home",
  "/dashboard/resumes": "Resumes",
  "/dashboard/job-tracker": "Applications",
  "/dashboard/work": "Work",
  "/dashboard/cover-letters": "Cover letters",
  "/dashboard/portfolio": "Portfolio",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

function getParentPath(pathname: string): string {
  return Object.keys(suggestions).find((path) => path !== "/dashboard" && pathname.startsWith(`${path}/`)) ?? "/dashboard";
}

export function getZebuSuggestions(pathname: string): ZebuSuggestion[] {
  return suggestions[pathname] ?? suggestions[getParentPath(pathname)];
}

export function getZebuPageLabel(pathname: string): string {
  if (/^\/dashboard\/resumes\/[^/]+$/.test(pathname)) return "Resume editor";
  if (/^\/dashboard\/applications\/[^/]+$/.test(pathname)) return "Application workspace";
  return pageLabels[pathname] ?? pageLabels[getParentPath(pathname)] ?? "Workspace";
}
