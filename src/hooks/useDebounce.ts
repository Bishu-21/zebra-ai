"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Debounces a value by the specified delay.
 * Used for the Compiler preview to avoid re-rendering on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Returns a debounced callback function.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
    callback: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => callback(...args), delay);
        }),
        [callback, delay]
    );
}
