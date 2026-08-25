import type { ZebuLiveState } from "@/hooks/useZebuLive";

export function ZebuVoiceOrb({ state, volume }: { state: ZebuLiveState; volume: number }) {
  return <div className={`zebu-orb zebu-orb--${state}`} style={{ "--zebu-volume": Math.max(0.08, volume) } as React.CSSProperties} aria-hidden="true">
    <span className="zebu-orb__core">
      <span className="zebu-orb__bar" />
      <span className="zebu-orb__bar" />
      <span className="zebu-orb__bar" />
      <span className="zebu-orb__bar" />
      <span className="zebu-orb__bar" />
    </span>
    <span className="zebu-orb__ring" />
    <span className="zebu-orb__ring zebu-orb__ring--two" />
  </div>;
}
