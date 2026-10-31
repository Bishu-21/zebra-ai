"use client";

import { useEffect, useRef } from "react";
import { createZebuKeyboardHandlers, type ZebuKeyboardOptions } from "@/lib/zebu-keyboard";

export function useZebuKeyboard(options: ZebuKeyboardOptions) {
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; }, [options]);
  useEffect(() => {
    const handlers = createZebuKeyboardHandlers({
      isOpen: options.isOpen,
      toggle: () => optionsRef.current.toggle(),
      close: () => optionsRef.current.close(),
      primeAudio: () => optionsRef.current.primeAudio(),
      startListening: () => optionsRef.current.startListening(),
      stopListening: () => optionsRef.current.stopListening(),
    });
    window.addEventListener("keydown", handlers.down);
    window.addEventListener("keyup", handlers.up);
    window.addEventListener("blur", handlers.release);
    return () => {
      window.removeEventListener("keydown", handlers.down);
      window.removeEventListener("keyup", handlers.up);
      window.removeEventListener("blur", handlers.release);
      handlers.release();
    };
  }, [options.isOpen]);
}
