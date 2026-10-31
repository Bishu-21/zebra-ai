import Link from "next/link";
import type { IconType } from "react-icons";
import { AppIcon } from "@/components/ui/AppIcon";

type Props = {
    icon: IconType;
    title: string;
    description: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

/** Shared layout for the dashboard's tool launchers. */
export function DashboardToolCard({ icon, title, description, href, onClick }: Props) {
    const className = "flex h-full min-h-44 w-full flex-col items-start rounded-2xl border border-neutral-200/70 bg-white p-5 text-left font-sans transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950";
    const content = <>
        <span className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-neutral-600">
            <AppIcon icon={icon} size={20} />
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">{title}</span>
        <span className="mt-1 text-sm font-normal leading-6 text-muted-foreground">{description}</span>
    </>;

    return href
        ? <Link href={href} className={className}>{content}</Link>
        : <button type="button" onClick={onClick} className={className}>{content}</button>;
}
