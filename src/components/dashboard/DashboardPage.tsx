import type { ReactNode } from "react";

export function DashboardPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-7xl space-y-8 px-5 py-6 pb-32 sm:px-6 md:px-10 md:py-10 ${className}`}>
      {children}
    </div>
  );
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm font-normal leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="w-full shrink-0 md:w-auto">{actions}</div> : null}
    </div>
  );
}

export function DashboardStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-28 rounded-[var(--radius-md)] border border-border-subtle bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
