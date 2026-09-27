"use client";

import { useEffect, useState } from 'react';
import { RiLoader4Line } from 'react-icons/ri';

/** Own the timer here so ticking does not rerender the entire analysis modal. */
export function ResumeProcessingStatus({ stage }: { stage: string }) {
    const [startedAt] = useState(() => Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [startedAt]);

    return (
        <>
            <RiLoader4Line className="animate-spin motion-reduce:animate-none text-[#0A0A0A]" size={32} aria-hidden="true" />
            <div className="flex flex-col items-center gap-2 text-center">
                <span role="status" className="text-xs font-bold text-[#0A0A0A]">{stage}</span>
                <span className="text-xs text-neutral-500" aria-hidden="true">{elapsedSeconds}s elapsed</span>
                <p className="text-xs text-neutral-500">This may take a minute or more. You can keep this tab open while we work.</p>
            </div>
        </>
    );
}
