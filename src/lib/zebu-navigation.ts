import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/navigation";

export const ZEBU_NAV_PAGES = [
  { key: "home", route: "/dashboard", phrases: ["home", "dashboard"] },
  { key: "applications", route: "/dashboard/job-tracker", phrases: ["applications", "application tracker", "job tracker"] },
  { key: "resumes", route: "/dashboard/resumes", phrases: ["resumes"] },
  { key: "work", route: "/dashboard/work", phrases: ["work", "work library"] },
  { key: "cover_letters", route: "/dashboard/cover-letters", phrases: ["cover letters", "cover letter"] },
  { key: "portfolio", route: "/dashboard/portfolio", phrases: ["portfolio"] },
  { key: "linkedin", route: "/dashboard/linkedin", phrases: ["linkedin optimizer", "linkedin"] },
  { key: "analytics", route: "/dashboard/analytics", phrases: ["analytics"] },
  { key: "settings", route: "/dashboard/settings", phrases: ["settings"] },
] as const;

export type ZebuPageKey = (typeof ZEBU_NAV_PAGES)[number]["key"];

export const ZEBU_PAGE_KEYS: ZebuPageKey[] = ZEBU_NAV_PAGES.map((page) => page.key);

export const ZEBU_PAGE_ROUTES: Record<ZebuPageKey, string> = Object.fromEntries(
  ZEBU_NAV_PAGES.map((page) => [page.key, page.route]),
) as Record<ZebuPageKey, string>;

export function resolveZebuPageRoute(page: string): string | null {
  return ZEBU_PAGE_ROUTES[page as ZebuPageKey] ?? null;
}

export function zebuPageMappingPrompt(): string {
  return ZEBU_NAV_PAGES.map((page) => `${page.key}=${page.route}`).join(", ");
}

/** Fail the test suite if Zebu destinations drift from the sidebar. */
export function zebuRoutesMatchSidebar(): boolean {
  const navHrefs = DASHBOARD_NAV_ITEMS.map((item) => item.href).sort();
  const zebuHrefs = [...new Set(ZEBU_NAV_PAGES.map((page) => page.route))].sort();
  return JSON.stringify(navHrefs) === JSON.stringify(zebuHrefs);
}
