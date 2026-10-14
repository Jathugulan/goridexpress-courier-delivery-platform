"use client";

import { cn } from "@/lib/utils";
import { HERO_SAMPLE_ROUTE } from "@/content/hero";

/* -------------------------------------------------------------------------- */
/*                                 Live badge                                 */
/* -------------------------------------------------------------------------- */

export interface LiveBadgeProps {
  className?: string;
  label?: string;
  /**
   * `soft` is the light-green pill from §12 — `#DCFCE7` behind dark green text.
   * `solid` is the saturated variant, kept for use on a coloured surface where
   * a pale pill would disappear.
   */
  tone?: "soft" | "solid";
}

const TONES = {
  soft: {
    pill: "bg-success-light text-success-dark shadow-[0_6px_16px_-8px_rgba(22,101,52,0.45)]",
    ping: "bg-success/60",
    dot: "bg-success",
  },
  solid: {
    pill: "bg-success text-white shadow-[0_6px_16px_-6px_rgba(22,163,74,0.7)]",
    ping: "bg-white/70",
    dot: "bg-white",
  },
} as const;

/**
 * Pulsing "LIVE" pill.
 *
 * `role="status"` makes the state announce politely, and the sr-only sentence
 * carries the meaning so the dot is never the only signal.
 */
export function LiveBadge({ className, label = "Live", tone = "soft" }: LiveBadgeProps) {
  const t = TONES[tone];

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1.5 pl-2.5 pr-3",
        "text-[11px] font-bold uppercase tracking-[0.08em]",
        t.pill,
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full motion-reduce:hidden",
            t.ping,
          )}
        />
        <span className={cn("relative inline-flex size-2 rounded-full", t.dot)} />
      </span>
      {label}
      <span className="sr-only">Tracking is updating in real time.</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Sample-data note                               */
/* -------------------------------------------------------------------------- */

/**
 * Makes it explicit that the route is demonstration content, not a customer
 * record. Rendered on `RoutePanel`, where the fictional place names are shown.
 */
export function SampleDataNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-[10.5px] font-medium text-ink-muted", className)}>
      {HERO_SAMPLE_ROUTE.disclaimer}
    </p>
  );
}
