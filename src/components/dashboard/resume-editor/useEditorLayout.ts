"use client";

import { useCallback, useEffect, useState } from 'react';

export function useEditorLayout() {
    const [editorWidth, setEditorWidth] = useState(38);
    const [isResizing, setIsResizing] = useState(false);
    const [isNarrowLayout, setIsNarrowLayout] = useState(false);
    const startResizing = useCallback(() => setIsResizing(true), []);

    useEffect(() => {
        const checkLayout = () => setIsNarrowLayout(window.innerWidth < 1024);
        checkLayout();
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    useEffect(() => {
        if (!isResizing) return;
        let frame: number | undefined;
        let latestWidth: number | undefined;
        const flush = () => {
            if (latestWidth !== undefined) setEditorWidth(latestWidth);
            frame = undefined;
        };
        const resize = (event: MouseEvent) => {
            const width = (event.clientX / window.innerWidth) * 100;
            if (width <= 20 || width >= 80) return;
            latestWidth = width;
            if (frame === undefined) frame = window.requestAnimationFrame(flush);
        };
        const stop = () => {
            if (frame !== undefined) window.cancelAnimationFrame(frame);
            flush();
            setIsResizing(false);
        };
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stop);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stop);
            if (frame !== undefined) window.cancelAnimationFrame(frame);
        };
    }, [isResizing]);

    return { editorWidth, isResizing, isNarrowLayout, startResizing };
}
