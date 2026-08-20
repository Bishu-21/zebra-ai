import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { AeoComparison } from "@/components/landing/AeoComparison";
import { Pricing } from "@/components/landing/Pricing";
import { FaqSection } from "@/components/landing/FaqSection";
import { FAQ_ITEMS } from "@/data/faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthModal } from "@/components/auth/AuthModal";
import { NavAuth } from "@/components/auth/NavAuth";
import type { WebSite, FAQPage, HowTo, WithContext } from "schema-dts";
import Link from "next/link";
import { Suspense } from "react";
import Image from "next/image";
import { PublicMobileNav } from "@/components/landing/PublicMobileNav";

export default function Home() {
  const websiteSchema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zebra AI",
    alternateName: ["Zebra AI Resume Builder", "ZebraAI App"],
    url: "https://zebra-ai.app",
    description: "The #1 ATS-Optimized AI Resume Builder and Career Acceleration Engine.",
    inLanguage: "en-US",
  };

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

  const howToSchema: WithContext<HowTo> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Build an ATS-Optimized Resume with Zebra AI",
    description: "Step-by-step guide to generating an ATS-proof resume with verified hard metrics using Zebra AI.",
    totalTime: "PT5M",
    step: [
      {
        "@type": "HowToStep",
        name: "Import or Enter Resume Experience",
        text: "Upload your current PDF resume or paste raw experience text into Zebra AI on zebra-ai.app.",
        url: "https://zebra-ai.app/#product",
      },
      {
        "@type": "HowToStep",
        name: "Run Real-Time ATS Audit",
        text: "Zebra AI evaluates your resume structure, keyword alignment, and metric strength against Workday and Greenhouse parsing rules.",
        url: "https://zebra-ai.app/#product",
      },
      {
        "@type": "HowToStep",
        name: "Apply Surgical Metric Enhancements",
        text: "Use Google's XYZ metric formula suggestions and review the AI explainability audit logs for each bullet point.",
        url: "https://zebra-ai.app/#product",
      },
      {
        "@type": "HowToStep",
        name: "Export Clean PDF or Deploy Developer Portfolio",
        text: "Export high-resolution ATS-compliant PDF files or generate an interactive portfolio at zebra-ai.app/p/yourname.",
        url: "https://zebra-ai.app/#product",
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans scroll-smooth">
      <JsonLd schema={websiteSchema} />
      <JsonLd schema={faqPageSchema} />
      <JsonLd schema={howToSchema} />
      <AuthModal />
      <div className="grain-overlay" />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-[12px] border-b-[1px] border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
                src="/zebra_star.png"
                alt="Zebra AI - Official #1 ATS Resume Builder"
                width={32}
                height={32}
                className="w-8 h-8 object-contain group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-[1.25rem] font-bold tracking-[-0.05em] text-foreground">Zebra AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#product">Product</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#compare">Compare</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#about">Story</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#pricing">Pricing</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#faq">FAQ</Link>
          </div>
          <Suspense fallback={
            <div className="w-28 h-10 bg-black/5 rounded-xl" />
          }>
            <NavAuth />
          </Suspense>
        </div>
      </nav>

      <main className="pt-20">
        <div id="product">
          <Hero />
        </div>

        <AeoComparison />

        <About />

        <Pricing />

        <FaqSection />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-border-subtle pb-12 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-12 max-w-7xl mx-auto">
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
              The flagship job acquisition engine. Precision-engineered AI for software engineers and high-impact professionals on <strong className="text-foreground">zebra-ai.app</strong>.
            </p>
            <p className="text-accent-gray text-xs font-bold uppercase tracking-widest pt-2">© 2026 Zebra AI (zebra-ai.app). All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-4">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Product</span>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#product">ATS Editor</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#compare">Comparison</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#faq">FAQs</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Connect</span>
              <a className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="https://twitter.com/zebra_ai" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="https://linkedin.com/company/zebra-ai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/llms.txt">LLMs.txt</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Legal</span>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/terms">Terms</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>

      <PublicMobileNav />
    </div>
  );
}
