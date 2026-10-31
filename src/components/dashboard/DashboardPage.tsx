import type { ReactNode } from "react";
import { FeatureIcon, featureIcons, type FeatureName } from "./FeatureIcon";

export function DashboardPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-7xl space-y-8 px-5 py-6 pb-32 font-sans sm:px-6 md:px-10 md:py-10 ${className}`}>
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
  const feature = title in featureIcons ? (title as FeatureName) : null;
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="max-w-2xl">
        <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
          {feature ? <FeatureIcon feature={feature} size={18} className="text-muted-foreground" /> : null}
          {title}
        </h1>
        <p className="mt-1 text-sm font-normal leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="w-full shrink-0 md:w-auto">{actions}</div> : null}
    </div>
  );
}

export function DashboardStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-28 rounded-xl border border-neutral-200/70 bg-white px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
