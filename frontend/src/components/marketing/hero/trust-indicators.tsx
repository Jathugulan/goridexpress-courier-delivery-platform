"use client";

import { cn } from "@/lib/utils";
import { HERO_TRUST } from "@/content/hero";
import { HeroReveal } from "./motion";

/* -------------------------------------------------------------------------- */
/*                             Trust indicators                               */
/* -------------------------------------------------------------------------- */

export interface TrustIndicatorsProps {
  className?: string;
  items?: readonly { icon: React.ComponentType<{ className?: string }>; label: string }[];
}

/**
 * Three reassurance points under the CTAs.
 *
 * Rendered as a list so the count is announced, and each item pairs its colour
 * with a tick glyph and a text label — colour is never the only signal.
 */
export function TrustIndicators({ className, items = HERO_TRUST }: TrustIndicatorsProps) {
  return (
    <HeroReveal className={cn("w-full", className)}>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {items.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-[13.5px] font-medium text-ink-secondary">
            <Icon className="size-[18px] shrink-0 text-success" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </HeroReveal>
  );
}
