import type { CSSProperties } from "react";
import type { ZebuLiveState } from "@/hooks/useZebuLive";

/** The supplied Zebu illustration is cropped to its face inside the animated SVG orb. */
export function ZebuVoiceOrb({ state, volume }: { state: ZebuLiveState; volume: number }) {
  return (
    <span
      className={`zebu-orb zebu-orb--${state}`}
      style={{ "--zebu-volume": Math.min(1, Math.max(0.08, volume)) } as CSSProperties}
      aria-hidden="true"
    >
      <svg className="zebu-pet" viewBox="0 0 128 144" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="zebu-face-clip">
            <circle cx="64" cy="67" r="58" />
          </clipPath>
        </defs>
        <circle cx="64" cy="67" r="61" fill="#fff" stroke="#171717" strokeWidth="3" />
        <g clipPath="url(#zebu-face-clip)">
          <image href="/zebu.jpg" x="-100" y="-8" width="240" height="240" preserveAspectRatio="xMidYMid meet" />
        </g>
        <circle cx="64" cy="67" r="58" fill="none" stroke="#171717" strokeWidth="2" />
      </svg>
      <span className="zebu-orb__ring" />
    </span>
  );
}
