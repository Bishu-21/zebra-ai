"use client";

import React, { useState, createContext, useContext, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";

// Optimized, inlined SVGs for hydration consistency and zero weight
const SuccessIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const InfoIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
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
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <m.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            // Removed layout prop to maintain compatibility with domAnimation bundle and fix Error #418
                            className={`
                                pointer-events-auto
                                flex items-center gap-3 px-6 py-4 
                                rounded-full shadow-2xl border backdrop-blur-xl
                                ${toast.type === "success" 
                                    ? "bg-black text-white border-white/10 shadow-black/20" 
                                    : "bg-white text-black border-black/5 shadow-black/5"}
                            `}
                        >
                            {toast.type === "success" ? (
                                <SuccessIcon size={20} className="text-green-400" />
                            ) : (
                                <InfoIcon size={20} className="text-blue-400" />
                            )}
                            <span className="text-sm font-black uppercase tracking-widest leading-none pt-0.5">
                                {toast.message}
                            </span>
                            <button 
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="ml-2 hover:opacity-70 transition-opacity"
                            >
                                <CloseIcon size={18} />
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
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
