export type ZebuLiveUiAction =
  | { type: "navigate"; route: string }
  | { type: "open_tool"; tool: "resume_analysis" | "role_match" }
  | { type: "start_flow"; flow: "application" }
  | { type: "open_proof_flow" };

export function applicationFormToolResult() {
  return {
    result: { success: true, note: "Application form requested; no record has been created." },
    uiAction: { type: "start_flow", flow: "application" },
  } as const;
}
