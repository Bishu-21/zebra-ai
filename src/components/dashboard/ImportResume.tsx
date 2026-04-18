"use client";

import React, { useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { 
    RiUploadCloud2Line, 
    RiArrowRightSLine, 
    RiLoader4Line
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function ImportResume() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState("");
    const { showToast } = useToast();
    const router = useRouter();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Client-side validation
        if (file.size > 5 * 1024 * 1024) {
            showToast("File size exceeds 5MB limit", "error");
            return;
        }

        setIsUploading(true);
        setUploadStep("Establishing Secure Connection...");
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 2. Upload & Extract
            setUploadStep("Extracting Document Data...");
            const res = await fetch("/api/resumes/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Neural extraction failed");

            // 3. Success Workflow
            setUploadStep("Mapping Document Structure...");
            showToast("Resume imported successfully", "success");
            
            // Artificial delay for premium feel
            setTimeout(() => {
                router.push(`/dashboard/resumes/${data.id}`);
            }, 800);

        } catch (err) {
            const error = err as Error;
            showToast(error.message, "error");
            setIsUploading(false);
            setUploadStep("");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="group/card relative overflow-hidden flex flex-col justify-between h-full cursor-pointer transition-all p-10 bg-white border border-black/[0.04] rounded-[2.5rem] hover:shadow-2xl hover:shadow-black/[0.03] active:scale-[0.99]"
        >
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
                className="hidden"
            />

            {/* Background Decorative Layer */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-black/[0.01] rounded-bl-[4rem] group-hover/card:scale-110 transition-transform" />
            
            {/* Cinematic Upload Overlay */}
            <AnimatePresence>
                {isUploading && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-8 text-center"
                    >
                        <div className="w-16 h-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center text-[#3B82F6]">
                            <RiLoader4Line size={32} className="animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#0A0A0A] animate-pulse">
                                {uploadStep}
                            </span>
                            <div className="w-40 h-1 bg-black/[0.05] rounded-full overflow-hidden mx-auto">
                                <m.div 
                                    className="h-full bg-[#3B82F6]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3, ease: "easeInOut" }}
                                />
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Card Content */}
            <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                    isUploading ? "bg-[#3B82F6] text-white" : "bg-black/[0.03] text-[#737373]/40 group-hover/card:bg-[#3B82F6] group-hover/card:text-white"
                }`}>
                    <RiUploadCloud2Line size={28} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#737373]">Import Source</span>
                    <RiArrowRightSLine size={14} className="text-[#3B82F6]" />
                </div>
            </div>

            <div className="relative">
                <h3 className="font-bold text-2xl mb-2 text-[#0A0A0A] tracking-tighter">Import Resume</h3>
                <p className="text-[0.65rem] text-[#737373] font-bold uppercase tracking-[0.1em] leading-relaxed">
                    Sync PDF, DOCX, or <br/> LinkedIn professional source.
                </p>
            </div>
        </div>
    );
}
