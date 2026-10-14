"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";

/* -------------------------------------------------------------------------- */
/*                                    Motion                                  */
/* -------------------------------------------------------------------------- */

/** Shared deceleration curve — matches `--ease-out-expo` in globals.css. */
export const HERO_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Stagger root for the hero. Set `initial="hidden" animate="show"` on this and
 * every `HeroReveal` below it joins the sequence in DOM order.
 *
 * Order is deliberate and matches the intended read: badge → heading →
 * description → actions → trust → courier → tracking card → status cards →
 * feature bar.
 */
export const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/** Default entrance for a hero child. */
export const heroItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: HERO_EASE },
  },
};

/** Entrance for the hero's focal elements — the photograph and the feature bar. */
export const heroFeature: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: HERO_EASE },
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Reveal                                    */
/* -------------------------------------------------------------------------- */

export interface HeroRevealProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  /** Pick a different entrance when an element needs more travel. */
  preset?: "item" | "feature";
}

const PRESETS: Record<NonNullable<HeroRevealProps["preset"]>, Variants> = {
  item: heroItem,
  feature: heroFeature,
};

/**
 * Wraps a hero child so it inherits the parent's stagger.
 *
 * Deliberately declares only `variants` — adding `initial`/`animate` here would
 * turn it into its own animation root and drop it out of the stagger.
 *
 * Reduced motion is handled one level up by `<MotionConfig reducedMotion="user">`
 * in `HeroSection`, which suppresses the transform and leaves the fade.
 */
export function HeroReveal({ preset = "item", children, ...props }: HeroRevealProps) {
  return (
    <motion.div variants={PRESETS[preset]} {...props}>
      {children}
    </motion.div>
  );
}
