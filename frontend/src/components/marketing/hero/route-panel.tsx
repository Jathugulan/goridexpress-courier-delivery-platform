"use client";

import { motion } from "framer-motion";
import { Bike, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_SAMPLE_ROUTE } from "@/content/hero";
import { SampleDataNote } from "./live-badge";

/* -------------------------------------------------------------------------- */
/*                                Route panel                                  */
/* -------------------------------------------------------------------------- */

export interface RoutePanelProps {
  className?: string;
  pickupLabel?: string;
  pickupPlace?: string;
  destinationLabel?: string;
  destinationPlace?: string;
  disclaimer?: string;
}

/**
 * The floating live-route panel, tucked **behind** the courier photograph.
 *
 * ### Why the map is not on the photograph
 *
 * The previous version laid a full-bleed street grid and route across the whole
 * frame. §9 rules that out directly — "instead of placing a huge map over the
 * entire rider" — and §17 makes the rider the primary focal point. So the map
 * moved out of the image and became its own panel.
 *
 * ### Why it sits behind rather than beside
 *
 * `CourierVisual` positions this panel so its top edge sits 80px *above* the
 * photograph, and gives it `pb-14` of empty padding underneath its content. The
 * photograph (z-20) then covers that padded lower half, so the panel reads as a
 * layer sliding out from behind the courier. Two things fall out of that:
 * occlusion of the rider is impossible by construction rather than by careful
 * tuning, and the map can never drift onto the subject at any viewport.
 *
 * The padding is why the two call sites differ — the floating instance needs the
 * extra height to hide, the in-flow one does not.
 *
 * ### The route runs horizontally
 *
 * §9 draws pickup → courier → destination as a vertical chain. A vertical route
 * needs a tall panel, and the only strip of panel left visible above the photo is
 * short and wide. Laying the same three stops out horizontally fits that shape,
 * keeps the reading order pickup → courier → destination, and is animated with a
 * travelling dash so it still reads as a live route.
 */
export function RoutePanel({
  className,
  pickupLabel = HERO_SAMPLE_ROUTE.pickup.label,
  pickupPlace = HERO_SAMPLE_ROUTE.pickup.place,
  destinationLabel = HERO_SAMPLE_ROUTE.destination.label,
  destinationPlace = HERO_SAMPLE_ROUTE.destination.place,
  disclaimer = HERO_SAMPLE_ROUTE.disclaimer,
}: RoutePanelProps) {
  const description =
    `Sample delivery route: pickup at ${pickupPlace}, courier in transit, ` +
    `destination ${destinationPlace}. ${disclaimer}.`;

  return (
    <div
      className={cn(
        "pointer-events-none w-full rounded-[22px] border border-white/70 p-4",
        "bg-white/85 shadow-[0_18px_44px_-18px_rgba(15,23,42,0.28)] backdrop-blur-[20px]",
        className,
      )}
      {...{ role: "img", "aria-label": description }}
    >
      {/* Endpoint, courier marker and the route between them, on one row. */}
      <div className="flex items-center gap-3">
        <Stop
          icon={<MapPin className="size-[13px]" />}
          tone="primary"
          label={pickupLabel}
          place={pickupPlace}
        />

        <RouteTrack />

        <Stop
          icon={<Bike className="size-[13px]" />}
          tone="courier"
          label="Courier"
          place="In transit"
        />

        <RouteTrack />

        <Stop
          icon={<MapPin className="size-[13px]" />}
          tone="error"
          label={destinationLabel}
          place={destinationPlace}
        />
      </div>

      <SampleDataNote className="mt-2.5" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Route panel parts                             */
/* -------------------------------------------------------------------------- */

const STOP_TONES = {
  primary: "bg-primary-light text-primary",
  courier: "bg-primary text-white",
  error: "bg-error-light text-error",
} as const;

/** One end of the route: a pin, a label and a place name. */
function Stop({
  icon,
  tone,
  label,
  place,
}: {
  icon: React.ReactNode;
  tone: keyof typeof STOP_TONES;
  label: string;
  place: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn("flex size-6 shrink-0 items-center justify-center rounded-full", STOP_TONES[tone])}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[9.5px] font-semibold uppercase leading-tight tracking-[0.09em] text-ink-muted">
          {label}
        </span>
        <span className="block truncate text-[12px] font-semibold leading-tight text-ink">{place}</span>
      </span>
    </div>
  );
}

/**
 * The blue connector between two stops.
 *
 * A faded rail shows the whole path, and a brighter dash travels along it — the
 * "route in motion" cue from §21. The dash is a `stroke-dashoffset` loop, and
 * because the whole hero sits inside `<MotionConfig reducedMotion="user">` a
 * visitor who asks for reduced motion gets a static route instead.
 *
 * The dash runs the full length rather than being clipped to the 72% figure.
 * The courier marker sits mid-panel for legibility, so a dash stopping at 72%
 * would contradict its position; the authoritative progress number is the bar in
 * `LiveTrackingCard`, not this decoration.
 */
function RouteTrack() {
  return (
    <svg
      className="h-4 min-w-6 flex-1 text-primary"
      viewBox="0 0 60 16"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d="M2 8h56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 6"
        animate={{ strokeDashoffset: [24, 0] }}
        transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
      />
    </svg>
  );
}
