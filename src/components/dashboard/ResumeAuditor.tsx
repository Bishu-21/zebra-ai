"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { RiBrainLine } from "react-icons/ri";

export function ResumeAuditor() {
  const [resumeText, setResumeText] = useState("Software Engineer. Developed React apps. Increased performance.");
  const [jobDescription, setJobDescription] = useState("Looking for a Senior Frontend Engineer with Next.js and performance optimization experience.");
  const [result, setResult] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);

  const handleAudit = async () => {
    setIsAuditing(true);
    setResult(""); // Clear previous results
    
    try {
      const response = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) {
        throw new Error("No reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setResult((prev) => prev + text);
      }
    } catch (error) {
      console.error("Audit error:", error);
      setResult("An error occurred during the audit process. Please try again.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="glass-card p-8 rounded-[2rem] max-w-3xl mx-auto mt-10 shadow-sm border border-black/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <RiBrainLine size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#0A0A0A]">Zebra Server Auditor</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-accent-gray">Powered by Gemini 1.5 Flash (Server-Side)</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#A3A3A3] mb-2 block ml-1">Resume Summary</label>
          <textarea 
            className="w-full h-32 p-4 bg-[#F5F5F5] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none outline-none custom-scrollbar"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#A3A3A3] mb-2 block ml-1">Job Description</label>
          <textarea 
            className="w-full h-32 p-4 bg-[#F5F5F5] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none outline-none custom-scrollbar"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
      </div>

      <button 
        onClick={handleAudit}
        disabled={isAuditing}
        className="w-full py-4 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 bg-[#0A0A0A] text-white hover:bg-[#262626] shadow-lg shadow-black/10 flex items-center justify-center gap-2"
      >
        {isAuditing ? "Auditing..." : "Run Server ATS Audit"}
      </button>

      {result && (
        <m.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-white rounded-2xl border border-black/[0.04] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <h3 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary mb-3">Audit Results</h3>
          <p className="text-sm leading-relaxed text-[#4A4A4A] whitespace-pre-wrap">
            {result}
          </p>
        </m.div>
      )}
    </div>
  );
}
