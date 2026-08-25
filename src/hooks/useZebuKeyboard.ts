"use client";

import { useEffect } from "react";

export function useZebuKeyboard(options: { isOpen: boolean; toggle: () => void; close: () => void; primeAudio: () => void; startListening: () => void | Promise<void>; stopListening: () => void }) {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === "KeyZ") { event.preventDefault(); options.toggle(); return; }
      if (!options.isOpen) return;
      if (event.code === "Escape") { event.preventDefault(); options.close(); return; }
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (event.code === "Space" && !typing && !event.repeat) {
        event.preventDefault();
        options.primeAudio();
        try { void Promise.resolve(options.startListening()).catch(() => undefined); }
        catch { /* The voice hook reports the actionable error in the assistant. */ }
      }
    };
    const up = (event: KeyboardEvent) => {
      if (options.isOpen && event.code === "Space") options.stopListening();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [options]);
}
