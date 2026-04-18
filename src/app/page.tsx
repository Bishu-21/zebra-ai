import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Pricing } from "@/components/landing/Pricing";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthModal } from "@/components/auth/AuthModal";
import { NavAuth } from "@/components/auth/NavAuth";
import type { WebSite, WithContext } from "schema-dts";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  const websiteSchema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zebra AI",
    url: "https://zebra-ai.app"
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary font-sans scroll-smooth">
      <JsonLd schema={websiteSchema} />
      <AuthModal />
      <div className="grain-overlay" />
      
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-[12px] border-b-[1px] border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/zebra_star.png" alt="Zebra AI" className="w-8 h-8 object-contain group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-[1.25rem] font-bold tracking-[-0.05em] text-foreground">Zebra AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#product">Product</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#about">Story</Link>
            <Link className="text-accent-gray hover:text-foreground text-xs font-bold uppercase tracking-widest transition-all duration-200" href="#pricing">Pricing</Link>
          </div>
          <Suspense fallback={
            <div className="w-28 h-10 bg-black/5 animate-pulse rounded-xl" />
          }>
            <NavAuth />
          </Suspense>
        </div>
      </nav>

      <main className="pt-20">
        <section id="product">
          <Hero />
        </section>
        
        <About />
        <Pricing />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-border-subtle pb-12 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-12 max-w-7xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/zebra_star.png" alt="Zebra AI" className="w-10 h-10 object-contain" />
              <div className="text-2xl font-bold tracking-tighter text-foreground">Zebra AI</div>
            </div>
            <p className="text-accent-dark font-medium text-sm max-w-xs leading-relaxed">
              Advancing the integrity of human career metadata through surgical precision AI.
            </p>
            <p className="text-accent-gray text-xs font-bold uppercase tracking-widest pt-2">© 2026 Zebra. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-4">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Connect</span>
              <a className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#">Twitter</a>
              <a className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="#">LinkedIn</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-accent-gray">Legal</span>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/terms">Terms</Link>
              <Link className="text-accent-dark hover:text-primary text-sm font-bold transition-colors duration-200" href="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-16 bg-white/70 backdrop-blur-[24px] rounded-2xl flex items-center justify-around px-2 z-50 border border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <Link href="#product" className="flex-1 flex flex-col items-center justify-center group">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#737373] group-hover:text-[#3B82F6] transition-all">Product</span>
          <div className="w-1 h-1 rounded-full bg-[#3B82F6] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <div className="w-[1px] h-6 bg-black/5" />
        <Link href="#about" className="flex-1 flex flex-col items-center justify-center group">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#737373] group-hover:text-[#3B82F6] transition-all">Manifesto</span>
          <div className="w-1 h-1 rounded-full bg-[#3B82F6] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <div className="w-[1px] h-6 bg-black/5" />
        <Link href="#pricing" className="flex-1 flex flex-col items-center justify-center group">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#737373] group-hover:text-[#3B82F6] transition-all">Pricing</span>
          <div className="w-1 h-1 rounded-full bg-[#3B82F6] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}
