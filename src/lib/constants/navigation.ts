export interface NavigationItem {
  href: string;
  label: string;
  breadcrumb: string;
  match: (pathname: string) => boolean;
}

export const DASHBOARD_NAV_ITEMS: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    breadcrumb: "Home",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/job-tracker",
    label: "Applications",
    breadcrumb: "Applications",
    match: (pathname: string) =>
      pathname.startsWith("/dashboard/job-tracker") ||
      pathname.startsWith("/dashboard/applications"),
  },
  {
    href: "/dashboard/resumes",
    label: "Resumes",
    breadcrumb: "Resumes",
    match: (pathname: string) => pathname.startsWith("/dashboard/resumes"),
  },
  {
    href: "/dashboard/work",
    label: "Work",
    breadcrumb: "Work",
    match: (pathname: string) => pathname.startsWith("/dashboard/work"),
  },
  {
    href: "/dashboard/cover-letters",
    label: "Cover Letters",
    breadcrumb: "Cover Letters",
    match: (pathname: string) => pathname.startsWith("/dashboard/cover-letters"),
  },
  {
    href: "/dashboard/portfolio",
    label: "Portfolio",
    breadcrumb: "Portfolio",
    match: (pathname: string) => pathname.startsWith("/dashboard/portfolio"),
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    breadcrumb: "Analytics",
    match: (pathname: string) => pathname.startsWith("/dashboard/analytics"),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    breadcrumb: "Settings",
    match: (pathname: string) => pathname.startsWith("/dashboard/settings"),
  },
];

export function getBreadcrumbForPath(pathname: string): {
  parent?: { label: string; href: string };
  title: string;
} {
  if (pathname.includes("/resumes/new")) {
    return {
      parent: { label: "Resumes", href: "/dashboard/resumes" },
      title: "New Resume",
    };
  }
  if (pathname.startsWith("/dashboard/resumes/")) {
    return {
      parent: { label: "Resumes", href: "/dashboard/resumes" },
      title: "Resume Editor",
    };
  }
  if (pathname.startsWith("/dashboard/applications/")) {
    return {
      parent: { label: "Applications", href: "/dashboard/job-tracker" },
      title: "Application Workspace",
    };
  }

  const matched = DASHBOARD_NAV_ITEMS.find((item) => item.match(pathname));
  return {
    title: matched ? matched.breadcrumb : "Home",
  };
}
