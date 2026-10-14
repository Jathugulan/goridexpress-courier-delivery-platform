"use client";

import { cn } from "@/lib/utils";
import { HERO_FEATURES } from "@/content/hero";
import { HeroReveal } from "./motion";

/* -------------------------------------------------------------------------- */
/*                                Feature bar                                 */
/* -------------------------------------------------------------------------- */

export interface HeroFeatureBarProps {
  className?: string;
  features?: readonly {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }[];
}

/**
 * Capability strip that straddles the hero's bottom edge.
 *
 * Four capability claims and no invented numbers — every entry has to stay true
 * without a verified data source.
 *
 * Grid follows the brief: one column on mobile, 2 × 2 from `lg` (768px), and the
 * four-up desktop bar with vertical separators from 1200px. The rules only
 * appear at four-up, where the columns are wide enough for them to read as
 * structure rather than noise.
 */
export function HeroFeatureBar({ className, features = HERO_FEATURES }: HeroFeatureBarProps) {
  return (
    <HeroReveal
      preset="feature"
      className={cn(
        "rounded-[22px] border border-line bg-white/[0.94] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7",
        className,
      )}
    >
      <ul
        className={cn(
          "grid gap-y-6",
          "lg:grid-cols-2 lg:gap-x-8 lg:gap-y-8",
          "min-[1200px]:grid-cols-4 min-[1200px]:gap-y-0",
        )}
      >
        {features.map(({ icon: Icon, title, description }) => (
          <li
            key={title}
            className={cn(
              "group flex items-start gap-3.5",
              "min-[1200px]:border-l min-[1200px]:border-line min-[1200px]:px-7",
              "min-[1200px]:first:border-l-0 min-[1200px]:first:pl-0 min-[1200px]:last:pr-0",
            )}
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white"
              aria-hidden="true"
            >
              <Icon className="size-[22px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-snug text-ink">{title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ink-secondary">
                {description}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </HeroReveal>
  );
}
