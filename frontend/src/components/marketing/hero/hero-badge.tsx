"use client";

import { cn } from "@/lib/utils";
import { HERO_BADGE } from "@/content/hero";
import { HeroReveal } from "./motion";

/* -------------------------------------------------------------------------- */
/*                                   Badge                                    */
/* -------------------------------------------------------------------------- */

export interface HeroBadgeProps {
  className?: string;
  /** Overrides the default content module entry. */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  label?: string;
}

/**
 * Compact pill that sits directly above the `h1`. Kept as its own component so
 * other hero variants can re-badge without touching the heading.
 */
export function HeroBadge({ className, icon: Icon = HERO_BADGE.icon, label = HERO_BADGE.label }: HeroBadgeProps) {
  return (
    <HeroReveal className={cn("inline-flex", className)}>
      <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-[9px] text-[13px] font-semibold uppercase leading-none tracking-[0.06em] text-primary">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </span>
    </HeroReveal>
  );
}
