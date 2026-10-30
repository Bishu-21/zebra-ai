import type { Metadata } from "next";
import Link from "next/link";
import { DASHBOARD_NAV_ITEMS } from "@/lib/constants/navigation";
import { PUBLIC_SITE_PAGES } from "@/lib/constants/public-pages";

export const metadata: Metadata = {
    title: "Sitemap",
    description: "Find Zebra AI pages, workspace features, and service policies.",
    alternates: { canonical: "/sitemap" },
};

const productSections = [
    { href: "/#product", label: "Product" },
    { href: "/#demo", label: "Product walkthrough" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "Frequently asked questions" },
];

const linkStyle = "inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-foreground underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950";

export default function SitemapPage() {
    return <div className="min-h-screen bg-background font-sans text-foreground">
        <header className="border-b border-border-subtle bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                <Link href="/" className="rounded-lg text-xl font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Zebra AI</Link>
                <Link href="/" className={linkStyle}>Back to home</Link>
            </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sitemap</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Find a page, explore a feature, or read our service policies.</p>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
                <section aria-labelledby="sitemap-product" className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <h2 id="sitemap-product" className="text-lg font-semibold">Explore Zebra AI</h2>
                    <ul className="mt-3 space-y-1">{productSections.map(item => <li key={item.href}><Link href={item.href} className={linkStyle}>{item.label}</Link></li>)}</ul>
                </section>
                <section aria-labelledby="sitemap-workspace" className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <h2 id="sitemap-workspace" className="text-lg font-semibold">Your workspace</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to open these features and view your saved work.</p>
                    <ul className="mt-3 space-y-1">{DASHBOARD_NAV_ITEMS.map(item => <li key={item.href}><Link href={item.href} className={linkStyle}>{item.label}</Link></li>)}</ul>
                    <Link href="/signin" className={linkStyle}>Sign in</Link>
                </section>
                <section aria-labelledby="sitemap-policies" className="rounded-2xl border border-neutral-200 bg-white p-5">
                    <h2 id="sitemap-policies" className="text-lg font-semibold">Pages and policies</h2>
                    <ul className="mt-3 space-y-1">{PUBLIC_SITE_PAGES.filter(item => item.href !== "/sitemap").map(item => <li key={item.href} className="pb-2"><Link href={item.href} className={linkStyle}>{item.label}</Link><p className="text-sm leading-6 text-muted-foreground">{item.description}</p></li>)}</ul>
                </section>
            </div>
        </main>
        <footer className="border-t border-border-subtle px-5 py-6 text-center text-sm text-muted-foreground">Zebra AI</footer>
    </div>;
}
