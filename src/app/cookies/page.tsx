import Link from "next/link";

export const metadata = { title: "Cookie Policy | Zebra AI" };

export default function CookiePolicyPage() {
  return <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-900">
    <Link href="/" className="underline">Zebra AI home</Link>
    <h1 className="mt-8 text-4xl font-bold">Cookie Policy</h1>
    <p className="mt-6 leading-7">Zebra AI uses essential authentication cookies to keep you signed in and to protect sign-in flows. A temporary cookie also validates a GitHub App installation if you choose to connect repositories. The app code has no browser advertising or site analytics cookies, so there is no optional tracking cookie choice to make. Server diagnostics may be sent to Azure Application Insights when enabled.</p>
    <p className="mt-4 leading-7">We also use browser storage for interface settings, unfinished drafts, and LinkedIn activity links you choose to record. This stays in your browser. When you choose to open payment checkout, Razorpay may set its own cookies under its policy. You can block or clear cookies in your browser, although account sign-in may stop working.</p>
    <p className="mt-4 leading-7">If optional analytics, advertising, or embedded media are added, this policy and the consent controls will need updating before those services load.</p>
    <nav aria-label="Legal pages" className="mt-10 flex gap-6 text-sm underline"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refund Policy</Link></nav>
  </main>;
}
