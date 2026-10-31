"use client";

import React, { useState } from "react";
import { RiShieldCheckLine, RiCloseLine } from "react-icons/ri";
import { DashboardToolCard } from "./DashboardToolCard";
import { ProjectProofAnalyzer } from "./ProjectProofAnalyzer";
import { m, AnimatePresence } from "framer-motion";

export function ProjectAnalyzerCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <DashboardToolCard
        icon={RiShieldCheckLine}
        title="Check my project"
        description="Fetch a public project URL and review proof points. Private repos need GitHub App access in Settings."
        onClick={() => setIsOpen(true)}
      />

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <m.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#F5F5F7] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-8 right-8 z-[110]">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-white transition-all shadow-lg"
                >
                  <RiCloseLine size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                <div className="mb-12">
                    <h2 className="text-4xl font-bold tracking-tighter text-black mb-4">Project Proof Analyzer</h2>
                    <p className="text-black/50 text-sm max-w-xl leading-relaxed">
                        Add a GitHub repository or live demo link to review the project and draft resume bullets grounded in its evidence.
                    </p>
                </div>
                
                <ProjectProofAnalyzer />
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
