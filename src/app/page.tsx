import { Hero } from "@/components/landing/Hero";
import { Benefits } from "@/components/landing/Benefits";
import { Pricing } from "@/components/landing/Pricing";
import { FaqSection } from "@/components/landing/FaqSection";
import { FAQ_ITEMS } from "@/data/faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthModal } from "@/components/auth/AuthModal";
import { NavAuth } from "@/components/auth/NavAuth";
import type { FAQPage, WithContext } from "schema-dts";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { PublicMobileNav } from "@/components/landing/PublicMobileNav";
import { BrandIntro } from "@/components/landing/BrandIntro";

export default function Home() {
  const faqPageSchema: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background font-sans text-foreground scroll-smooth selection:bg-primary/20 selection:text-primary">
      <JsonLd schema={faqPageSchema} />
      <AuthModal />
      <BrandIntro />
      <div className="grain-overlay" />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-[12px] border-b-[1px] border-border-subtle">
        <div className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-20 sm:px-5 md:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 group sm:gap-3">
            <Image
                src="/zebra_star.png"
                alt="Zebra AI resume builder"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 object-contain transition-transform duration-300 group-hover:rotate-12"
            />
            <span className="truncate text-lg font-bold tracking-[-0.05em] text-foreground sm:text-xl">Zebra AI</span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex xl:gap-10">
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#product">Product</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#how-it-works">How it works</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#pricing">Pricing</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#faq">FAQ</Link>
          </div>
          <div className="hidden lg:block">
            <Suspense fallback={
              <div className="w-28 h-10 bg-black/5 rounded-xl" />
            }>
              <NavAuth />
            </Suspense>
          </div>
          <PublicMobileNav />
        </div>
      </nav>

      <main className="pt-16 sm:pt-20">
        <div id="product">
          <Hero />
        </div>

        <Benefits />

        <Pricing />

        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-border-subtle">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-4 py-12 sm:px-5 md:flex-row md:items-center md:gap-12 md:px-12 md:py-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/zebra_star.png"
                alt="Zebra AI"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <div className="text-2xl font-bold tracking-tighter text-foreground">Zebra AI</div>
            </div>
            <p className="text-accent-dark font-medium text-sm max-w-xs leading-relaxed">
              Import a resume, review suggested changes for a job, and export a PDF when you are ready.
            </p>
            <p className="text-accent-gray text-xs font-bold uppercase tracking-widest pt-2">© 2026 Zebra AI (zebra-ai.app). All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-accent-gray">Product</span>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#product">Product</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#how-it-works">How it works</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#pricing">Pricing</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#faq">FAQ</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-accent-gray">Connect</span>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/dashboard">Dashboard</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/signin">Sign in</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/sitemap">Sitemap</Link>
              <a className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/llms.txt">LLMs.txt</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-accent-gray">Legal</span>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/terms">Terms</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/privacy">Privacy</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/cookies">Cookies</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/refunds">Refunds</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
