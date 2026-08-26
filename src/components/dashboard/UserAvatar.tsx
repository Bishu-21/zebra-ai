"use client";

import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
    name: string;
    src?: string | null;
    size: number;
    className?: string;
    fallbackClassName?: string;
}

function isSupportedAvatarUrl(value: string): boolean {
    if (value.startsWith("/")) return true;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && (
            url.hostname === "googleusercontent.com" ||
            url.hostname.endsWith(".googleusercontent.com")
        );
    } catch {
        return false;
    }
}

export function UserAvatar({ name, src, size, className = "", fallbackClassName = "" }: UserAvatarProps) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const usableSrc = src && isSupportedAvatarUrl(src) && failedSrc !== src ? src : null;

    if (!usableSrc) {
        return (
            <span className={`flex h-full w-full items-center justify-center font-bold ${fallbackClassName}`} aria-hidden="true">
                {name.trim().charAt(0).toUpperCase() || "U"}
            </span>
        );
    }

    return (
        <Image
            src={usableSrc}
            alt={`${name} profile photo`}
            width={size}
            height={size}
            sizes={`${size}px`}
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => setFailedSrc(usableSrc)}
            className={`h-full w-full object-cover ${className}`}
        />
    );
}
