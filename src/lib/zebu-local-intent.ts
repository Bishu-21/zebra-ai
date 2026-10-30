import { ZEBU_NAV_PAGES } from "@/lib/zebu-navigation";

export type ZebuWorkspaceCommand = {
  route: string;
  openApplicationForm: boolean;
};

const CREATE_APPLICATION = "(?:create|add|start|make) (?:me )?(?:a |an )?(?:new )?application(?: draft)?(?: for me)?";
const OPEN = "(?:go to|open|show me|take me to|navigate to|bring me to|switch to)";

/** Route only unambiguous commands locally; questions and entity lookups go to the agent. */
export function parseZebuWorkspaceCommand(input: string): ZebuWorkspaceCommand | null {
  const text = input.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (new RegExp(`^(?:please )?${CREATE_APPLICATION}$`).test(text)) {
    return { route: "/dashboard/job-tracker", openApplicationForm: true };
  }

  const pagesLongestFirst = [...ZEBU_NAV_PAGES].sort((a, b) => {
    const aLen = Math.max(...a.phrases.map((phrase) => phrase.length));
    const bLen = Math.max(...b.phrases.map((phrase) => phrase.length));
    return bLen - aLen;
  });

  for (const page of pagesLongestFirst) {
    const phrase = page.phrases.map((item) => item.replace(/\s+/g, "\\s+")).join("|");
    const navigate = new RegExp(`^(?:please )?${OPEN} (?:the |my )?(?:${phrase})(?: page)?$`);
    const navigateAndCreate = new RegExp(`^(?:please )?${OPEN} (?:the |my )?(?:${phrase})(?: page)? and ${CREATE_APPLICATION}$`);
    if (page.key === "applications" && navigateAndCreate.test(text)) {
      return { route: "/dashboard/job-tracker", openApplicationForm: true };
    }
    if (navigate.test(text)) {
      return { route: page.route, openApplicationForm: false };
    }
  }

  return null;
}
