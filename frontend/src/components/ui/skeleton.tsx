import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                  Skeleton                                 */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton rounded-lg", className)} {...props} />;
}

export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
}: {
  lines?: number;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full", lineClassName)}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Loading placeholders                         */
/* -------------------------------------------------------------------------- */

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-card p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-card p-5 shadow-card", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-[10px]" />
        <Skeleton className="h-9 w-24 rounded-[10px]" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <div className="border-b border-line bg-muted/60 px-5 py-3.5">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((__, c) => (
              <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-24" : c === cols - 1 ? "w-16" : "flex-1")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className, height = 280 }: { className?: string; height?: number }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-card p-5 shadow-card", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-[10px]" />
      </div>
      <Skeleton className="mt-6 w-full rounded-xl" style={{ height }} />
    </div>
  );
}

export function SkeletonWizardStep({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className={cn("h-11 w-full", i % 3 === 0 && "w-2/3")} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard({ stats = 4 }: { stats?: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonChart className="lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl border border-line" />
      </div>
    </div>
  );
}

/** Accessible live region announcing an in-progress operation. */
export function LoadingRegion({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {label}…
    </div>
  );
}
