import React from "react";
import { ResumeAuditor } from "@/components/dashboard/ResumeAuditor";

export default function NanoTestPage() {
  return (
    <div className="p-10 max-w-[1600px] mx-auto min-h-screen">
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h1 className="text-[2.5rem] font-black tracking-[-0.04em] leading-tight mb-3 text-[#0A0A0A]">
          Server AI Testing
        </h1>
        <p className="text-[#737373] text-[1.05rem] font-medium leading-relaxed">
          Testing server-side LLM execution with Gemini 1.5 Flash. This approach prevents high browser memory usage.
        </p>
      </div>

      <ResumeAuditor />
    </div>
  );
}
