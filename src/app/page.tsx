import React from "react";
import { Hero } from "@/components/landing/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthTrigger } from "@/components/auth/AuthTrigger";
// Let's use standard Next.js Image for the testimonial portrait
import Image from "next/image";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { WebSite } from "schema-dts";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const websiteSchema: WebSite = {
    "@type": "WebSite",
    name: "Zebra AI",
    url: "http://localhost:3000"
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-[#0A0A0A] selection:bg-[#3B82F6] selection:text-white font-['Inter']">
      <JsonLd schema={websiteSchema} />
      <AuthModal />
      
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#FFFFFF]/80 backdrop-blur-[4px]">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between border-b-[1.5px] border-[#EAEAEA]">
          <div className="text-[1.1rem] font-extrabold tracking-[-0.04em] text-[#0A0A0A]">
            Zebra AI
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm font-[500] tracking-wide transition-colors duration-200" href="#">Process</a>
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm font-[500] tracking-wide transition-colors duration-200" href="#">Case Studies</a>
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm font-[500] tracking-wide transition-colors duration-200" href="#">Pricing</a>
          </div>
          <AuthTrigger 
            isLoggedIn={!!session}
            className="bg-[#FFFFFF] border-[1.5px] border-[#EAEAEA] text-[#0A0A0A] font-bold text-sm px-6 py-2 rounded-full hover:bg-[#F6F3F2] active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            {session ? "Dashboard" : "Sign In"}
          </AuthTrigger>
        </div>
      </nav>

      {/* Main Hero with Framer Motion & Scratch Card */}
      <main>
        <Hero isLoggedIn={!!session} />
        
        {/* Tonal Layered Content Section */}
        <section className="max-w-7xl mx-auto mt-24 mb-32 grid grid-cols-1 md:grid-cols-2 gap-20 items-start px-8">
          <div className="space-y-12">
            <h2 className="text-[1.75rem] font-bold leading-[1.2] tracking-[-0.02em]">The 1% Difference</h2>
            <p className="text-[1rem] font-[400] text-[#6B6B6B] max-w-md">
              We don't just generate text. We audit the technical metadata of your career. Zebra AI uses surgical precision to align your experience with algorithmic gatekeepers.
            </p>
            <div className="bg-[#F6F3F2] p-12 rounded-[16px]">
              <p className="text-[0.75rem] font-bold tracking-[0.05em] uppercase text-[#2563EB] mb-4">Real-time Feedback</p>
              <div className="space-y-4">
                <div className="h-2 bg-[#3B82F6] w-3/4 rounded-full"></div>
                <div className="h-2 bg-[#A3A3A3] w-1/2 rounded-full"></div>
                <div className="h-2 bg-[#A3A3A3] w-2/3 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#FFFFFF] p-12 rounded-[16px] shadow-[0px_10px_30px_rgba(0,0,0,0.02)] mt-12 md:mt-0 relative overflow-hidden">
            {/* The Intelligence Trace */}
            <div className="border-l-2 border-[#3B82F6] pl-6 space-y-8">
              <p className="text-[1rem] leading-relaxed italic text-[#6B6B6B]">
                "Zebra identified 14 formatting errors that were making my resume unreadable to standard ATS software. Three days after the fix, I had two interviews."
              </p>
              <div className="flex items-center gap-4 mt-8">
                <div className="w-10 h-10 bg-[#EAEAEA] rounded-full overflow-hidden shrink-0">
                  {/* Replaced 350KB unoptimized image with tiny direct avatar API */}
                  <Image 
                    src="https://ui-avatars.com/api/?name=Marcus+Chen&background=EAEAEA&color=0A0A0A&size=80"
                    alt="Marcus Chen" 
                    width={40}
                    height={40}
                    unoptimized
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0A0A0A]">Marcus Chen</p>
                  <p className="text-[0.75rem] font-bold tracking-[0.05em] uppercase text-[#6B6B6B]">Senior Product Designer</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#F6F3F2] mt-auto pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 max-w-7xl mx-auto">
          <div className="space-y-4">
            <div className="text-lg font-bold text-[#0A0A0A]">Zebra AI</div>
            <p className="text-[#6B6B6B] font-[400] text-sm">© 2026 Zebra AI. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm transition-colors duration-200" href="#">Twitter</a>
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm transition-colors duration-200" href="#">LinkedIn</a>
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm transition-colors duration-200" href="#">Status</a>
            <a className="text-[#6B6B6B] hover:text-[#0A0A0A] text-sm transition-colors duration-200" href="#">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Visible only on md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FFFFFF]/90 backdrop-blur-[8px] border-t border-[#EAEAEA] flex items-center justify-around px-4 z-50 pb-safe">
        <div className="flex flex-col flex-1 items-center justify-center text-[#2563EB] font-bold h-full">
          <span className="text-[10px] uppercase tracking-wider mt-1">Product</span>
        </div>
        <div className="flex flex-col flex-1 items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors h-full">
          <span className="text-[10px] uppercase tracking-wider mt-1">Pricing</span>
        </div>
        <div className="flex flex-col flex-1 items-center justify-center text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors h-full">
          <span className="text-[10px] uppercase tracking-wider mt-1">About</span>
        </div>
      </div>
    </div>
  );
}
