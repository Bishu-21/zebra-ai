"use client";

import React, { useState, createContext, useContext, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";

// Optimized, inlined SVGs for hydration consistency and zero weight
const SuccessIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ErrorIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InfoIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

type ToastType = "success" | "info" | "error";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        // Redact any raw SQL or database error strings before rendering to UI
        let cleanMessage = message;
        if (cleanMessage.includes("Failed query") || cleanMessage.includes("relation \"") || cleanMessage.includes("code: '42P01'")) {
            cleanMessage = "Database operation pending. Please refresh in a moment.";
        }
        
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message: cleanMessage, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2.5 max-w-lg w-[90vw] pointer-events-none items-center">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <m.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                            className={`
                                pointer-events-auto
                                flex items-center gap-3 px-4 py-3 
                                rounded-2xl shadow-xl border backdrop-blur-xl
                                max-w-full text-xs font-semibold leading-snug
                                ${toast.type === "success" 
                                    ? "bg-[#0A0A0A] text-white border-white/10 shadow-black/20" 
                                    : toast.type === "error"
                                    ? "bg-red-950/90 text-red-100 border-red-500/30 shadow-red-950/30"
                                    : "bg-white text-[#0A0A0A] border-neutral-200 shadow-neutral-200/50"}
                            `}
                        >
                            {toast.type === "success" && <SuccessIcon className="text-emerald-400 shrink-0" />}
                            {toast.type === "error" && <ErrorIcon className="text-red-400 shrink-0" />}
                            {toast.type === "info" && <InfoIcon className="text-neutral-500 shrink-0" />}

                            <span className="truncate max-w-[360px] text-xs font-medium">
                                {toast.message}
                            </span>

                            <button 
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="ml-1 opacity-60 hover:opacity-100 transition-opacity shrink-0 p-1"
                                aria-label="Close notification"
                            >
                                <CloseIcon />
                            </button>
                        </m.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return { showToast: (message: string, type?: ToastType) => console.warn("Toast used outside provider:", message, type) };
    }
    return context;
}
