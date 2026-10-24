export type ZebuWorkspaceCommand = {
  route: "/dashboard/job-tracker";
  openApplicationForm: boolean;
};

/** Route only unambiguous commands locally; questions and entity lookups go to the agent. */
export function parseZebuWorkspaceCommand(input: string): ZebuWorkspaceCommand | null {
  const text = input.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  const create = "(?:create|add|start|make) (?:me )?(?:a |an )?(?:new )?application(?: draft)?(?: for me)?";
  if (new RegExp(`^(?:please )?${create}$`).test(text)) {
    return { route: "/dashboard/job-tracker", openApplicationForm: true };
  }
  const navigate = "(?:go to|open|show me|take me to|navigate to|bring me to|switch to) (?:the |my )?applications(?: page)?";
  if (new RegExp(`^(?:please )?${navigate}(?: and ${create})?$`).test(text)) {
    return { route: "/dashboard/job-tracker", openApplicationForm: new RegExp(` and ${create}$`).test(text) };
  }
  return null;
}
