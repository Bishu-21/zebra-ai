"use client";

import { useEffect } from "react";
import { useZebu } from "@/context/ZebuContext";

export function ZebuEntityContext({ kind, id, title }: { kind: "resume" | "application"; id: string; title: string }) {
    const { setEntityContext } = useZebu();

    useEffect(() => {
        setEntityContext({ kind, id, title });
        return () => setEntityContext(null);
    }, [id, kind, setEntityContext, title]);

    return null;
}
