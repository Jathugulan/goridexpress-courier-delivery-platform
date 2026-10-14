"use client";

import { ArrowUpRight, Bike, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HERO_SAMPLE_ROUTE } from "@/content/hero";
import { HERO_EASE, HeroReveal } from "./motion";
import { LiveBadge } from "./live-badge";

/* -------------------------------------------------------------------------- */
/*                               Progress bar                                 */
/* -------------------------------------------------------------------------- */

export interface DeliveryProgressProps {
  percent: number;
  className?: string;
  label?: string;
}

/**
 * Journey completion bar.
 *
 * The fill is driven by `scaleX` rather than `width` so that
 * `<MotionConfig reducedMotion="user">` can suppress it — a user who asks for
 * less motion gets the final state immediately instead of a sliding bar.
 *
 * `aria-valuetext` spells the percentage out, so the number is not conveyed by
 * bar length alone.
 */
export function DeliveryProgress({ percent, className, label = "Delivery progress" }: DeliveryProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const ratio = clamped / 100;

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${clamped} percent complete`}
    >
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
        <motion.span
          className="block h-full w-full origin-left rounded-full bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: ratio }}
          transition={{ duration: 1.1, ease: HERO_EASE, delay: 0.45 }}
        />
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{clamped}%</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Live tracking card                             */
/* -------------------------------------------------------------------------- */

export interface LiveTrackingCardProps {
  className?: string;
  headline?: string;
  detail?: string;
  percent?: number;
  etaLabel?: string;
  etaValue?: string;
  distanceLabel?: string;
  distanceValue?: string;
  href?: string;
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-[17px] font-bold leading-none tabular-nums text-ink">{value}</p>
    </div>
  );
}

/**
 * The hero's primary data card: where the parcel is, how far it has left.
 *
 * Floats over the left edge of the photograph on desktop so it bridges the copy
 * column and the visual. Frosted rather than solid so the scene stays visible
 * behind it without hurting text contrast.
 *
 * The `LIVE` pill shares the detail row rather than the header, which is what
 * §10 draws and what keeps the headline from truncating — see the note inline.
 */
export function LiveTrackingCard({
  className,
  headline = HERO_SAMPLE_ROUTE.headline,
  detail = HERO_SAMPLE_ROUTE.detail,
  percent = HERO_SAMPLE_ROUTE.progressPercent,
  etaLabel = HERO_SAMPLE_ROUTE.etaLabel,
  etaValue = HERO_SAMPLE_ROUTE.etaValue,
  distanceLabel = HERO_SAMPLE_ROUTE.distanceLabel,
  distanceValue = HERO_SAMPLE_ROUTE.distanceValue,
  href = "/track",
}: LiveTrackingCardProps) {
  return (
    <HeroReveal
      className={cn(
        "w-full rounded-[18px] border border-white/80 bg-white/[0.90] p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-[20px] sm:p-[18px]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Bike className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
          <p className="truncate text-[15px] font-bold leading-tight text-ink">{headline}</p>
        </div>

        <Link
          href={href}
          aria-label={`Open live tracking for this ${detail.toLowerCase()}`}
          className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-[10px] text-ink-muted transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <ArrowUpRight className="size-[18px]" aria-hidden="true" />
        </Link>
      </div>

      {/* The LIVE pill shares this row rather than the header. In the header it
          would eat the ~134px the icon, pill and link button need, leaving 118px
          for a headline that needs ~142px — so "Courier is on the way" truncated.
          Down here there is room.

          The detail line wraps instead of truncating: at the narrowest card
          (260px, from 1200px) it has ~150px against a ~162px string, and losing
          the tail of "Your package is in transit" would be worse than a second
          line. The card is vertically centred, so a taller card just grows both
          ways. */}
      <div className="mt-1.5 flex items-start justify-between gap-2.5">
        <p className="min-w-0 text-[13px] leading-snug text-ink-secondary">{detail}</p>
        <LiveBadge className="shrink-0 px-2.5 py-1" />
      </div>

      <DeliveryProgress percent={percent} className="mt-4" />

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3.5">
        <Metric icon={Clock3} label={etaLabel} value={etaValue} />
        <Metric icon={MapPin} label={distanceLabel} value={distanceValue} />
      </div>
    </HeroReveal>
  );
}
