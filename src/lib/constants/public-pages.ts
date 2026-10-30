/** Public document routes shared by the visitor and search sitemaps. */
export const PUBLIC_SITE_PAGES = [
    { href: "/", label: "Home", description: "Explore Zebra AI and see how it works." },
    { href: "/terms", label: "Terms of service", description: "Read the conditions for using Zebra AI." },
    { href: "/privacy", label: "Privacy policy", description: "Understand how your information is handled." },
    { href: "/cookies", label: "Cookie policy", description: "Learn how cookies are used." },
    { href: "/refunds", label: "Refund policy", description: "Read the payment and refund terms." },
    { href: "/sitemap", label: "Sitemap", description: "Find public pages and workspace features." },
] as const;
