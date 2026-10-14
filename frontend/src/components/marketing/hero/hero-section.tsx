"use client";

import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HERO_ACCENTS } from "@/content/hero";
import { CourierVisual } from "./courier-visual";
import { HeroContent } from "./hero-content";
import { HeroFeatureBar } from "./hero-feature-bar";
import { heroContainer } from "./motion";

/* -------------------------------------------------------------------------- */
/*                                  Backdrop                                  */
/* -------------------------------------------------------------------------- */

/**
 * Atmospheric layer behind the hero copy.
 *
 * Three restrained elements only: a blue/sky radial wash, a sparse blue dot
 * field masked to the copy column, and one dashed route line. Everything is
 * low-contrast and non-interactive — the backdrop should be felt, not read.
 */
function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Blue atmospheric wash */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(115% 85% at 78% 6%, rgba(37, 99, 235, 0.16) 0%, transparent 58%)," +
              "radial-gradient(85% 65% at 8% 0%, rgba(14, 165, 233, 0.12) 0%, transparent 55%)",
          }}
        />

        {/* Sparse blue dots, faded out towards the edges */}
        <div
          className="absolute inset-y-0 left-0 w-full opacity-60 xl:w-[52%]"
          style={{
            backgroundImage: `radial-gradient(${HERO_ACCENTS.dotPattern.dot} 1px, transparent 1px)`,
            backgroundSize: HERO_ACCENTS.dotPattern.size,
            maskImage: "radial-gradient(75% 65% at 22% 34%, #000 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(75% 65% at 22% 34%, #000 0%, transparent 78%)",
          }}
        />

        {/* Faint curved route line, top right */}
        <svg
          className="absolute -right-[8%] top-[4%] hidden h-[62%] w-[58%] text-primary/[0.11] lg:block"
          viewBox="0 0 600 400"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d={HERO_ACCENTS.routePath}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10 14"
          />
        </svg>

        {/* Soft blue glow anchoring the courier column */}
        <div className="absolute right-[4%] top-1/2 hidden size-[540px] -translate-y-1/2 rounded-full bg-primary/[0.09] blur-[110px] xl:block" />
      </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Hero section                                */
/* -------------------------------------------------------------------------- */

export interface HeroSectionProps {
  className?: string;
  /** Overrides for the two halves; used by campaign variants of the hero. */
  content?: React.ReactNode;
  visual?: React.ReactNode;
  features?: React.ReactNode;
}

/**
 * Home page hero.
 *
 * Structure: the navbar sits above this in `PublicHeader` (it is shared across
 * the public site rather than nested here, so it does not re-render with the
 * hero). This owns the copy column, the courier visual, and the feature bar
 * that overlaps its lower edge.
 *
 * ### Column split
 *
 * §1 asks for 42/58 with the visual slightly wider, on both tablet and desktop.
 * Because the ratio is the same at both sizes it is a single value rather than
 * the two-step grid this used to need. The copy column is capped at 520px — 42%
 * of a 1440px screen is a 558px measure, and the last 38px of that is claimed by
 * the tracking card overhanging from the visual, so the cap is what keeps the
 * paragraph clear of it.
 *
 * ### Height
 *
 * A 620px floor keeps the hero from collapsing on short landscape phones, rising
 * to 650px on tablet and 700px on desktop. The visual column is the taller of the
 * two (an 80px route panel above a 3:2 frame is ~593px at 1440px), and the inner
 * wrapper is a flex column with `justify-center` so the content stays optically
 * centred rather than top-aligned against the min-height.
 *
 * The hero is wrapped in `<MotionConfig reducedMotion="user">`, so visitors who
 * ask for reduced motion get the finished layout with fades only and no
 * transform movement. The root is the single animation source; every
 * `HeroReveal` below inherits its stagger rather than animating on its own.
 */
export function HeroSection({ className, content, visual, features }: HeroSectionProps) {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="hero"
        aria-labelledby="hero-title"
        className={cn(
          "relative isolate flex min-h-[620px] flex-col overflow-hidden rounded-b-[32px]",
          "bg-gradient-to-b from-card via-app-bg to-surface-secondary",
          "lg:min-h-[650px]",
          "min-[1200px]:min-h-[700px]",
          className,
        )}
      >
        <HeroBackdrop />

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className={cn(
            "relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center",
            "px-4 pb-24 pt-12",
            "sm:px-6 sm:pt-16",
            "lg:px-8 lg:pb-28 lg:pt-20",
            "min-[1200px]:pb-32 min-[1200px]:pt-24",
          )}
        >
          <div
            className={cn(
              "grid items-center gap-10",
              "lg:grid-cols-[0.42fr_0.58fr] lg:gap-8",
              "min-[1200px]:grid-cols-[0.42fr_0.58fr] min-[1200px]:gap-12",
              "min-[1600px]:gap-16",
            )}
          >
            {content ?? <HeroContent />}
            {visual ?? <CourierVisual />}
          </div>
        </motion.div>
      </section>

      {/* Feature bar — pulled up so it straddles the hero's rounded bottom edge. */}
      <div
        className={cn(
          "relative z-20 mx-auto -mt-14 w-full max-w-[1440px] px-4 pb-8",
          "sm:px-6 sm:pb-10",
          "lg:-mt-20 lg:px-8 lg:pb-12",
        )}
      >
        {features ?? <HeroFeatureBar />}
      </div>
    </MotionConfig>
  );
}
