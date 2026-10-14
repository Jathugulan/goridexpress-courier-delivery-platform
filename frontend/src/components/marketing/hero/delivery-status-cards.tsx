"use client";

import { cn } from "@/lib/utils";
import { HERO_STATUS_CARDS } from "@/content/hero";

/* -------------------------------------------------------------------------- */
/*                           Delivery status cards                            */
/* -------------------------------------------------------------------------- */

export interface DeliveryStatusCardsProps {
  className?: string;
  /**
   * `compact` tightens padding and the icon so the longest label
   * ("Package Picked Up") still fits the narrow 180px floating column set from
   * 1200px. Below that the cards are full-width, where the roomier default reads
   * better.
   */
  variant?: "compact" | "regular";
  items?: readonly {
    icon: React.ComponentType<{ className?: string }>;
    tone: "blue" | "green";
    title: string;
    value: string;
    done?: boolean;
  }[];
}

const TONE_CLASSES = {
  blue: "bg-primary-light text-primary",
  green: "bg-success-light text-success",
} as const;

const ROW_CLASSES = {
  compact: "gap-2.5 p-2.5",
  regular: "gap-3 p-3.5",
} as const;

const ICON_CLASSES = {
  compact: { box: "size-7 rounded-lg", glyph: "size-4" },
  regular: { box: "size-9 rounded-xl", glyph: "size-[18px]" },
} as const;

/**
 * The three status chips: picked up, ETA, distance.
 *
 * A list, so assistive tech announces how many updates there are.
 *
 * Layout is intentionally neutral — a plain vertical stack, no width and no
 * breakpoint rules. `CourierVisual` renders this in two different places (a
 * narrow floating column from 1200px, and a full-width stack below the photo
 * below that), and baking either one's sizing in here fought the other. Callers
 * set width and arrangement through `className`, and pick the padding scale with
 * `variant`.
 */
export function DeliveryStatusCards({
  className,
  variant = "regular",
  items = HERO_STATUS_CARDS,
}: DeliveryStatusCardsProps) {
  const icon = ICON_CLASSES[variant];

  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {items.map(({ icon: Icon, tone, title, value, done }) => (
        <li
          key={title}
          className={cn(
            "flex items-center rounded-[16px] border border-line/70 bg-card shadow-[0_10px_30px_rgba(15,23,42,0.10)]",
            ROW_CLASSES[variant],
          )}
        >
          <span
            className={cn("flex shrink-0 items-center justify-center", icon.box, TONE_CLASSES[tone])}
            aria-hidden="true"
          >
            <Icon className={icon.glyph} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-semibold leading-tight text-ink">{title}</span>
            <span className="mt-0.5 block text-[11.5px] leading-tight tabular-nums text-ink-secondary">
              {value}
            </span>
          </span>

          {/* Completion tick on the settled step. A shape as well as a colour, so
              the state survives a colour-blind or high-contrast reading. */}
          {done ? (
            <span
              className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-white"
              aria-hidden="true"
            >
              <svg viewBox="0 0 12 12" className="size-2.5" fill="none" strokeWidth={2.5}>
                <path d="M2.5 6.5 4.75 8.75 9.5 3.75" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
