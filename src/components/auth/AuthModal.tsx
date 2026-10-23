"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { AuthForm } from "./AuthForm";
import { useDialogFocus } from "@/hooks/useDialogFocus";

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-auth", handleOpen);
    return () => window.removeEventListener("open-auth", handleOpen);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  const dialogRef = useDialogFocus(isOpen, onClose);

  // Prevent background scrolling while the dialog is open.
  useEffect(() => {
    if (isOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
          {/* Backdrop */}
          <m.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <m.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Zebra AI account access"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-neutral-200 z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-muted text-muted-foreground hover:bg-neutral-200 hover:text-foreground flex items-center justify-center transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <Suspense fallback={<div className="py-12 text-center text-xs text-neutral-400">Loading...</div>}>
              <AuthForm onSuccess={onClose} showHeader={true} />
            </Suspense>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
