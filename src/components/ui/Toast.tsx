"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCheckboxCircleLine, RiInformationLine, RiCloseLine } from "react-icons/ri";

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
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            layout
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
                                <RiCheckboxCircleLine size={20} className="text-green-400" />
                            ) : (
                                <RiInformationLine size={20} className="text-blue-400" />
                            )}
                            <span className="text-sm font-black uppercase tracking-widest leading-none pt-0.5">
                                {toast.message}
                            </span>
                            <button 
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                className="ml-2 hover:opacity-70 transition-opacity"
                            >
                                <RiCloseLine size={18} />
                            </button>
                        </motion.div>
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
