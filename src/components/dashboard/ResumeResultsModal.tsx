"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    RiCloseCircleLine, 
    RiCheckboxCircleLine, 
    RiInformationLine, 
    RiMagicLine, 
    RiFocus3Line, 
    RiBarChartLine,
    RiFileTextLine,
    RiAlertLine,
    RiFlashlightLine,
    RiArrowRightUpLine,
    RiShieldCheckLine
} from "react-icons/ri";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface ResumeResultsModalProps {
    isOpen: boolean;
    onCloseAction: () => void;
    resumeId?: string;
    data: {
        score: number;
        summary: string;
        metrics: {
            impact: number;
            formatting: number;
            ats: number;
            branding: number;
        };
        strengths: string[];
        weaknesses: string[];
        actionItems: string[];
        suggestedBulletPoints: string[];
    } | null;
}

const CircularGauge = ({ value, label, icon: Icon }: { value: number; label: string; icon: any }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 backdrop-blur-md border border-white/60 p-6 rounded-2xl flex flex-col items-center text-center group hover:bg-white/60 transition-all shadow-sm"
        >
            <div className="relative w-24 h-24 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="rgba(0,0,0,0.05)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="black"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-black">{value}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className="text-black/30" />
                <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-black">{label}</span>
            </div>
        </motion.div>
    );
};

export function ResumeResultsModal({ isOpen, onCloseAction, resumeId, data }: ResumeResultsModalProps) {
    const { showToast } = useToast();
    const router = useRouter();

    if (!data) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} Copied to Clipboard`, "success");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCloseAction}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white/95 backdrop-blur-3xl w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="p-10 border-b border-black/5 flex items-center justify-between sticky top-0 bg-white/40 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10 transition-transform">
                                    <RiShieldCheckLine size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-black tracking-tight">Intelligence Audit </h2>
                                    <p className="text-[0.8rem] font-medium text-black/40 flex items-center gap-2">
                                        Scan complete. <span className="w-1 h-1 bg-black/20 rounded-full"></span> 
                                        Refining your professional narrative for <span className="text-black font-bold uppercase tracking-widest text-[0.6rem]">Global Benchmarks</span>.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onCloseAction}
                                className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center text-black/30 hover:text-black hover:bg-black group transition-all"
                            >
                                <RiCloseCircleLine size={24} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        {/* Analysis Content */}
                        <div className="flex-grow overflow-y-auto p-10 space-y-16 no-scrollbar pb-24">
                            {/* Score & Summary Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 bg-black p-10 rounded-3xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                    <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }} 
                                        className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl opacity-50"
                                    />
                                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/50 mb-6 relative">Impact Audit</p>
                                    <div className="relative mb-6">
                                        <motion.h3 
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-8xl font-bold tracking-tighter text-white"
                                        >
                                            {data.score}
                                        </motion.h3>
                                        <span className="absolute -top-2 -right-6 text-2xl font-bold text-white/30 tracking-widest">%</span>
                                    </div>
                                    <p className="text-[0.75rem] font-medium text-white/70 leading-relaxed relative max-w-xs">
                                        {data.summary}
                                    </p>
                                </div>

                                <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <CircularGauge value={data.metrics?.impact ?? data.score} label="Impact" icon={RiFlashlightLine} />
                                    <CircularGauge value={data.metrics?.formatting ?? data.score} label="Formatting" icon={RiBarChartLine} />
                                    <CircularGauge value={data.metrics?.ats ?? data.score} label="ATS Optimized" icon={RiMagicLine} />
                                    <CircularGauge value={data.metrics?.branding ?? data.score} label="Branding" icon={RiFocus3Line} />
                                </div>
                            </div>

                            {/* Dual Logic Column: Strengths & Weaknesses */}
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 gap-12"
                            >
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 pb-4 border-b border-black/5">
                                        <div className="w-1.5 h-6 bg-black rounded-full" />
                                        <h4 className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-black">Strategic Strengths</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {(data.strengths || []).map((item, i) => (
                                            <motion.div key={i} variants={itemVariants} className="flex items-start gap-4 bg-black/[0.02] p-5 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                                                <RiCheckboxCircleLine size={18} className="text-black/60 mt-0.5 flex-shrink-0" />
                                                <span className="text-[0.85rem] font-medium text-black/80 leading-relaxed">{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 pb-4 border-b border-black/5">
                                        <div className="w-1.5 h-6 bg-black/20 rounded-full" />
                                        <h4 className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-black/40">Critical Deficits</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {(data.weaknesses || []).map((item, i) => (
                                            <motion.div key={i} variants={itemVariants} className="flex items-start gap-4 bg-white border border-black/10 p-5 rounded-2xl hover:border-black/20 transition-colors shadow-sm shadow-black/[0.02]">
                                                <RiAlertLine size={18} className="text-black/20 mt-0.5 flex-shrink-0" />
                                                <span className="text-[0.85rem] font-medium text-black/40 leading-relaxed">{item}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Tactics & Rewrites Section */}
                            <div className="space-y-12">
                                <div className="bg-black text-white p-12 rounded-3xl relative overflow-hidden shadow-xl border border-white/5">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"
                                    />
                                    <RiMagicLine size={120} className="absolute -bottom-10 -right-10 text-white/5" />
                                    <div className="relative z-10 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <RiFlashlightLine size={24} className="text-blue-400" />
                                            <h4 className="text-2xl font-bold tracking-tight">Tactical Action Items</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(data.actionItems || []).map((item, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    onClick={() => copyToClipboard(item, "Task")}
                                                    className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl border border-white/5 hover:bg-white/20 transition-all cursor-pointer group/item active:scale-95"
                                                >
                                                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[0.6rem] font-black group-hover/item:bg-white group-hover/item:text-black transition-colors">{i+1}</span>
                                                    <span className="text-sm font-bold tracking-tight">{item}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-12 bg-black/[0.01] border border-black/5 rounded-3xl space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <RiFileTextLine size={24} className="text-black/60" />
                                            <h4 className="text-2xl font-bold tracking-tight text-black">Deep Dive: Intelligence Rewrites</h4>
                                        </div>
                                        <div className="px-4 py-1.5 bg-blue-500 rounded-full text-[0.6rem] font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-500/20">
                                            Elite Feature
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {(data.suggestedBulletPoints || []).map((point, i) => (
                                            <motion.div 
                                                key={i} 
                                                variants={itemVariants}
                                                onClick={() => copyToClipboard(point, "Strategy")}
                                                className="group relative p-6 bg-white rounded-3xl border border-black/5 hover:border-black/20 hover:shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                                            >
                                                <RiMagicLine className="absolute top-6 right-6 text-black/20 group-hover:text-black group-hover:rotate-12 transition-all" size={24} />
                                                <p className="text-sm font-medium text-black/70 pr-10 group-hover:text-black transition-colors leading-relaxed">
                                                    {point}
                                                </p>
                                                <div className="mt-4 flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest text-black/40 group-hover:text-blue-500 transition-colors">
                                                    Copy Strategy <RiArrowRightUpLine size={14} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 border-t border-black/5 flex items-center justify-between sticky bottom-0 bg-white/40 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-black/40">System Integrity: Optimal</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={onCloseAction}
                                    className="px-8 py-5 text-black/40 font-black text-[0.7rem] uppercase tracking-widest hover:text-black transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={() => {
                                        const id = resumeId || "new";
                                        router.push(`/dashboard/resumes/${id}`);
                                        onCloseAction();
                                    }}
                                    className="px-12 py-5 bg-black text-white rounded-2xl font-black text-sm transition-all shadow-2xl hover:shadow-black/20 tracking-wider uppercase active:scale-95"
                                >
                                    Deploy Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
