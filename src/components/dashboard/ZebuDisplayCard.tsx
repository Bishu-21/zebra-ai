import { RiArrowRightUpLine, RiBriefcase4Line, RiFileTextLine, RiTimeLine } from "react-icons/ri";
import type { ZebuDisplayCard as Card } from "@/lib/zebu-contract";

export function ZebuDisplayCard({ card, onOpen }: { card: Card; onOpen: (href: string) => void }) {
  const Icon = card.kind === "deadline" ? RiTimeLine : card.kind === "resume" ? RiFileTextLine : RiBriefcase4Line;
  return <button type="button" onClick={() => card.href && onOpen(card.href)} disabled={!card.href} className={`zebu-card text-left ${card.urgency ? `zebu-card--${card.urgency}` : ""}`}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5"><Icon size={17} /></span>
    <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-neutral-900">{card.title}</strong>{card.subtitle ? <span className="mt-0.5 block truncate text-[0.68rem] text-neutral-500">{card.subtitle}</span> : null}{card.meta ? <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-wide text-neutral-600">{card.meta}</span> : null}</span>
    {card.href ? <RiArrowRightUpLine className="text-neutral-400" /> : null}
  </button>;
}
