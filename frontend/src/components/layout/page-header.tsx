import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  badge,
  crumbs,
  actions,
  align = "center",
  tone = "default",
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  badge?: { label: string; tone?: "primary" | "info" | "warning" | "success" | "neutral" };
  crumbs?: readonly Crumb[];
  actions?: React.ReactNode;
  align?: "left" | "center";
  tone?: "default" | "muted" | "primary";
  className?: string;
  children?: React.ReactNode;
}) {
  const tones = {
    default: "bg-app-bg",
    muted: "bg-muted/50",
    primary: "bg-primary-light/50 dark:bg-primary/10",
  }[tone];

  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-line px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14",
        tones,
        className,
      )}
    >
      {crumbs && crumbs.length > 0 ? <Breadcrumbs items={crumbs} /> : null}

      <div
        className={cn(
          "mx-auto flex w-full max-w-4xl flex-col gap-4",
          align === "center" ? "items-center text-center" : "items-start",
        )}
      >
        {eyebrow || badge ? (
          <div className="flex flex-wrap items-center gap-2">
            {badge ? <Badge variant={badge.tone ?? "primary"}>{badge.label}</Badge> : null}
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
            ) : null}
          </div>
        ) : null}

        <h1 className="text-balance text-3xl font-black tracking-tight text-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {description ? (
          <p
            className={cn(
              "max-w-2xl text-pretty text-base leading-relaxed text-ink-muted",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        ) : null}

        {actions ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}

        {children}
      </div>
    </header>
  );
}

export function Breadcrumbs({ items, className }: { items: readonly Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-5", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-ink-secondary">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="size-3.5 text-ink-disabled" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
