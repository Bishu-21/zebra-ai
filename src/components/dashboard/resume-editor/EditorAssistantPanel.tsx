"use client";

import { SafeMarkdown } from "@/components/ui/SafeMarkdown";
import { m } from "framer-motion";
import React from "react";
import {
RiCheckboxCircleFill,
RiCheckLine,
RiCloseCircleLine,
RiCloseLine,
RiCommandLine,
RiLoader4Line,
RiMagicLine,
RiRobot2Line
} from "react-icons/ri";

interface Props {
    setShowAiPanel: React.Dispatch<React.SetStateAction<boolean>>;
    aiSuggestions: { original: string; problem: string; after: string; rationale: string; }[];
    isAiLoading: boolean;
    setAiSuggestions: React.Dispatch<React.SetStateAction<{ original: string; problem: string; after: string; rationale: string; }[]>>;
    applySuggestion: (text: string) => void;
    chatMessages: { role: "user" | "model"; content: string; }[];
    isChatLoading: boolean;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    handleSendMessage: (e?: React.FormEvent) => Promise<void>;
    chatInput: string;
    setChatInput: React.Dispatch<React.SetStateAction<string>>;
}

export function EditorAssistantPanel({ setShowAiPanel, aiSuggestions, isAiLoading, setAiSuggestions, applySuggestion, chatMessages, isChatLoading, chatEndRef, handleSendMessage, chatInput, setChatInput }: Props) {
    return (
                    <>
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAiPanel(false)}
                            className="fixed inset-0 bg-black/20 z-[180] lg:hidden"
                        />
                        <m.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            role="complementary"
                            aria-label="ZE-AI resume assistant"
                            className="fixed top-0 right-0 h-full w-full lg:w-[420px] bg-background border-l border-border-subtle shadow-[-16px_0_36px_rgba(0,0,0,0.08)] z-[200] flex flex-col">
                            <div className="h-11 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-[var(--radius-sm)] bg-primary/10 flex items-center justify-center">
                                        <RiRobot2Line size={12} className="text-primary" />
                                    </div>
                                    <span className="text-xs font-black text-foreground tracking-tight uppercase">AI Assistant</span>
                                </div>
                                <button onClick={() => setShowAiPanel(false)} className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center text-muted-foreground hover:bg-muted transition-all">
                                    <RiCloseLine size={16} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {/* MAGIC SUGGESTIONS AREA */}
                                {aiSuggestions.length > 0 && (
                                    <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-6 border-b border-border-subtle">
                                        <div className="flex items-center gap-2 mb-4">
                                            <RiMagicLine size={12} className="text-primary" />
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">AI Suggestions</p>
                                        </div>
                                        {isAiLoading ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                <RiLoader4Line size={24} className="text-primary animate-spin" />
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Optimizing...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {aiSuggestions.map((s, idx) => (
                                                    <m.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="overflow-hidden border border-border-subtle rounded-[var(--radius-lg)] bg-background shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                                                    >
                                                        {/* Header with Dismiss */}
                                                        <div className="flex items-center justify-between px-3 py-2 bg-background border-b border-border-subtle">
                                                            <div className="flex items-center gap-1.5">
                                                                <RiMagicLine size={10} className="text-primary" />
                                                                <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Suggestion #{idx + 1}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setAiSuggestions(prev => prev.filter((_, i) => i !== idx))}
                                                                className="text-muted-foreground/60 hover:text-red-500 transition-colors"
                                                            >
                                                                <RiCloseLine size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Before & Problem */}
                                                        <div className="p-3 bg-muted/30 border-b border-border-subtle space-y-3">
                                                            {s.original && (
                                                                <div className="space-y-1">
                                                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Before</span>
                                                                    <p className="text-[10px] text-muted-foreground leading-relaxed line-through opacity-50">&quot;{s.original}&quot;</p>
                                                                </div>
                                                            )}
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <RiCloseCircleLine size={10} className="text-red-500/60" />
                                                                    <span className="text-[8px] font-black text-red-500/60 uppercase tracking-widest">The Issue</span>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground leading-relaxed italic">{s.problem}</p>
                                                            </div>
                                                        </div>

                                                        {/* The Rewrite */}
                                                        <div className="p-3 space-y-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <RiCheckboxCircleFill size={10} className="text-emerald-500" />
                                                                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">The Solution</span>
                                                                </div>
                                                                <p className="text-[11px] text-secondary font-bold leading-relaxed">{s.after}</p>
                                                            </div>

                                                            <div className="p-2 bg-primary/5 rounded-[var(--radius-md)] border border-primary/10">
                                                                <p className="text-[9px] text-primary leading-tight font-medium">
                                                                    <span className="font-black uppercase mr-1">Rationale:</span> {s.rationale}
                                                                </p>
                                                            </div>

                                                            <button
                                                                onClick={() => applySuggestion(s.after)}
                                                                className="w-full h-8 bg-primary hover:bg-primary-dark text-white rounded-[var(--radius-md)] text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-primary/10 active:scale-[0.98] flex items-center justify-center gap-2"
                                                            >
                                                                <RiCheckLine size={12} />
                                                                Apply Improvement
                                                            </button>
                                                        </div>
                                                    </m.div>
                                                ))}
                                            </div>
                                        )}
                                    </m.div>
                                )}

                                {/* CHAT HISTORY */}
                                <div className="space-y-4">
                                    {chatMessages.length === 0 && aiSuggestions.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-20 gap-4">
                                            <RiRobot2Line size={48} />
                                            <p className="text-[11px] font-bold text-center max-w-[200px] uppercase tracking-widest leading-loose">
                                                Select a field for suggestions or ask for advice.
                                            </p>
                                        </div>
                                    )}

                                    {chatMessages.map((msg, idx) => (
                                        <m.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[90%] p-3 rounded-[var(--radius-xl)] text-[13px] ${
                                                msg.role === 'user'
                                                ? 'bg-foreground text-white rounded-tr-none'
                                                : 'bg-muted text-secondary border border-border-subtle rounded-tl-none font-medium'
                                            }`}>
                                                {msg.role === 'model'
                                                    ? <SafeMarkdown content={msg.content} />
                                                    : <p className="whitespace-pre-wrap break-words leading-5">{msg.content}</p>}
                                            </div>
                                        </m.div>
                                    ))}
                                    {isChatLoading && (
                                        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                            <div className="bg-muted border border-border-subtle p-3 rounded-[var(--radius-xl)] rounded-tl-none">
                                                <div className="flex gap-1">
                                                    <m.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-primary" />
                                                    <m.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-primary" />
                                                    <m.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-primary" />
                                                </div>
                                            </div>
                                        </m.div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {/* CHAT INPUT AREA */}
                            <div className="p-4 pb-[68px] sm:pb-4 border-t border-border-subtle bg-background shrink-0">
                                <form onSubmit={handleSendMessage} className="relative group">
                                    <input
                                        id="ze-ai-chat-input"
                                        name="ze-ai-chat-input"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask ZE-AI anything..."
                                        disabled={isChatLoading}
                                        className="w-full h-11 bg-muted border border-border-subtle rounded-[var(--radius-xl)] px-4 pr-12 text-xs font-medium focus:border-primary focus:bg-background transition-all outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || isChatLoading}
                                        className="absolute right-1.5 top-1.5 w-8 h-8 rounded-[var(--radius-md)] bg-foreground text-white flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-0"
                                    >
                                        <RiCommandLine size={14} />
                                    </button>
                                </form>
                            </div>
                        </m.div>
                    </>
                );
}
