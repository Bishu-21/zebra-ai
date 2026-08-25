"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getZebuSuggestions, type ZebuSuggestion } from "@/lib/zebu-suggestions";

type ZebuContextValue = {
  isOpen: boolean;
  open: (listen?: boolean) => void;
  close: () => void;
  toggle: () => void;
  pathname: string;
  suggestions: ZebuSuggestion[];
  entityContext: { kind: "resume" | "application"; id: string; title: string } | null;
  setEntityContext: (context: ZebuContextValue["entityContext"]) => void;
};

export const ZEBU_LISTEN_REQUEST_EVENT = "zebu:listen-request";

const ZebuContext = createContext<ZebuContextValue | null>(null);

export function ZebuProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [entityContext, setEntityContextState] = useState<ZebuContextValue["entityContext"]>(null);
  const setEntityContext = useCallback((context: ZebuContextValue["entityContext"]) => setEntityContextState(context), []);
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
    entityContext,
    setEntityContext,
  }), [entityContext, isOpen, pathname, setEntityContext]);
  return <ZebuContext.Provider value={value}>{children}</ZebuContext.Provider>;
}

export function useZebu() {
  const value = useContext(ZebuContext);
  if (!value) throw new Error("useZebu must be used inside ZebuProvider");
  return value;
}
