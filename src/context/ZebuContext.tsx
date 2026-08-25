"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getZebuSuggestions } from "@/lib/zebu-suggestions";

type ZebuContextValue = {
  isOpen: boolean;
  open: (listen?: boolean) => void;
  close: () => void;
  toggle: () => void;
  pathname: string;
  suggestions: string[];
};

export const ZEBU_LISTEN_REQUEST_EVENT = "zebu:listen-request";

const ZebuContext = createContext<ZebuContextValue | null>(null);

export function ZebuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(() => ({
    isOpen,
    open: (listen = false) => {
      setIsOpen(true);
      if (listen) window.dispatchEvent(new CustomEvent(ZEBU_LISTEN_REQUEST_EVENT));
    },
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((value) => !value),
    pathname,
    suggestions: getZebuSuggestions(pathname),
  }), [isOpen, pathname]);
  return <ZebuContext.Provider value={value}>{children}</ZebuContext.Provider>;
}

export function useZebu() {
  const value = useContext(ZebuContext);
  if (!value) throw new Error("useZebu must be used inside ZebuProvider");
  return value;
}
