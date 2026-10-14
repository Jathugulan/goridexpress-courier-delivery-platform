"use client";

import { cn } from "@/lib/utils";
import { HERO_DESCRIPTION, HERO_EYEBROW, HERO_HEADING } from "@/content/hero";
import { HeroActions } from "./hero-actions";
import { HeroBadge } from "./hero-badge";
import { TrustIndicators } from "./trust-indicators";
import { HeroReveal } from "./motion";

/* -------------------------------------------------------------------------- */
/*                                   Content                                  */
/* -------------------------------------------------------------------------- */

export interface HeroContentProps {
  className?: string;
  eyebrow?: React.ReactNode;
  badge?: React.ReactNode;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  trust?: React.ReactNode;
}

/**
 * The typography-led half of the hero.
 *
 * Every block shares one left edge and one measure so the column reads as a
 * single vertical axis. Slot props let a variant swap any part without
 * reimplementing the layout.
 *
 * Order is the brief's: tagline eyebrow, badge, heading, description, CTAs,
 * trust row. The eyebrow is new — "Fast. Safe. Reliable." used to be the
 * headline, and the new `<h1>` ("Your Delivery. In Motion.") would otherwise
 * drop the tagline from the page entirely.
 *
 * The column caps at 520px from `lg`. That is not only a readability measure: the
 * tracking card overhangs the visual's left edge by 72px, and a 558px copy column
 * (42% of 1440) minus 520px is the clearance that stops the paragraph running
 * underneath it.
 */
export function HeroContent({
  className,
  eyebrow,
  badge,
  heading,
  description,
  actions,
  trust,
}: HeroContentProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-start",
        "lg:max-w-[520px] lg:justify-center",
        className,
      )}
    >
      {eyebrow ?? (
        <HeroReveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">
            {HERO_EYEBROW.label}
          </p>
        </HeroReveal>
      )}

      {badge ?? <HeroBadge className="mt-3.5" />}

      {heading ?? (
        <HeroReveal className="mt-6 w-full">
          <h1
            id="hero-title"
            className={cn(
              "text-[40px] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink",
              // 46px at 390px, 52px across tablet, climbing to 74px at 1600px.
              // §6 caps the desktop size at 74px, so `3xl` stops there.
              "md:text-[46px]",
              "lg:text-[52px]",
              "min-[1200px]:text-[64px]",
              "2xl:text-[70px]",
              "min-[1600px]:text-[74px]",
            )}
          >
            {HERO_HEADING.map((line) => (
              <span key={line.word} className="block">
                {line.accent ? <span className="text-primary">{line.word}</span> : line.word}
              </span>
            ))}
          </h1>
        </HeroReveal>
      )}

      {description ?? (
        <HeroReveal className="mt-5 w-full">
          <p
            className={cn(
              "max-w-[480px] text-pretty leading-[1.6] text-ink-secondary",
              "text-[16px]",
              "lg:text-[17px]",
              "min-[1200px]:text-[18px]",
            )}
          >
            {HERO_DESCRIPTION}
          </p>
        </HeroReveal>
      )}

      {actions ?? <HeroActions className="mt-7" />}

      {trust ?? <TrustIndicators className="mt-5" />}
    </div>
  );
}
