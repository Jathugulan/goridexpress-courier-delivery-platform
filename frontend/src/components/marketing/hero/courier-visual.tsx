"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { HERO_COURIER_IMAGE, HERO_SAMPLE_ROUTE } from "@/content/hero";
import { DeliveryStatusCards } from "./delivery-status-cards";
import { HeroReveal } from "./motion";
import { RoutePanel } from "./route-panel";
import { LiveTrackingCard } from "./live-tracking-card";

/* -------------------------------------------------------------------------- */
/*                                Backdrop veil                               */
/* -------------------------------------------------------------------------- */

/**
 * Light wash laid over the photograph.
 *
 * Two restrained gradients only: a soft white lift at the top so the floating
 * cards always sit on a light backdrop, and a blue pool at the base to tie the
 * frame into the hero's gradient. There is no map here any more — the route
 * lives on `RoutePanel`, behind the image, because §9 rules out covering the
 * rider with cartography.
 */
function CourierVeil() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-white/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#DBEAFE]/45 to-transparent" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Courier visual                                */
/* -------------------------------------------------------------------------- */

export interface CourierVisualProps {
  className?: string;
  image?: {
    src: string;
    width: number;
    height: number;
    alt: string;
    objectPosition: string;
  };
}

/**
 * The hero's right half: the courier photograph and the three glass overlays.
 *
 * ### The courier is the subject, so nothing is allowed to sit on top of him
 *
 * §17 puts the rider at the top of the visual hierarchy and says the map and
 * floating cards must not overpower him; §9 says the same about the map. The
 * composition is built so that is structurally true rather than a matter of
 * tuning:
 *
 * ```
 *   ┌───────────────────────────────────────────────┐  ← route panel (behind)
 *   │ ● PICKUP ──── 🛵 ──── ● DESTINATION          │
 *   └──────╲________________________________________┘
 *          ╲   ← photograph overlaps the panel here
 *   ┌───────╲───────────────────────────────────────┐
 *   │        │                                       │
 *   │ ┌─────────────┐                               │
 *   │ │ TRACKING    │        the rider sits here,   │  ┌────────────┐
 *   │ │ CARD        │        left deliberately      │  │ PICKED UP  │
 *   │ └─────────────┘        clear of every card    │  │ ETA        │
 *   │        │                                       │  │ DISTANCE   │
 *   └────────┴───────────────────────────────────────┘  └────────────┘
 * ```
 *
 * The route panel is the only element allowed behind the photograph, and the
 * photograph's top edge is what hides its lower half — so the map can never
 * reach the rider regardless of viewport. The two floating card stacks are
 * pinned to the left and right margins, leaving the centre of the frame clear.
 *
 * ### Frame ratio is 3:2, matching the asset exactly
 *
 * `hero-courier.jpg` is 2400 × 1600, so `aspect-[3/2]` is an exact match and
 * `object-cover` crops nothing. §19 forbids awkwardly cropping the helmet, face,
 * scooter or delivery box, and the only reliable way to guarantee that is to
 * stop cropping at all.
 *
 * ### Breakpoints
 *
 * - `< lg`: one column. Order follows §18 exactly — photograph, then tracking
 *   card, then status cards. The route panel moves into the flow above the photo,
 *   because there is no room to offset it.
 * - `lg` to `1200px`: 42/58 split. The frame is only ~390 × 260 here, too short
 *   to float a 190px tracking card and a 212px status stack without them
 *   colliding, so both stay in flow beneath the photo.
 * - `>= 1200px`: 42/58 split, frame 631 × 421 rising to 770 × 513, and
 *   everything floats. The tracking card overhangs the left edge into the 48px
 *   grid gap and the status stack sits against the right edge; the middle ~41% of
 *   the frame — where the rider is — stays clear of both.
 */
export function CourierVisual({ className, image = HERO_COURIER_IMAGE }: CourierVisualProps) {
  return (
    <div className={cn("relative w-full", className)}>
      {/* Route panel — floats behind the photograph from `lg`, in flow below it.
          `lg:-top-20` lifts it 80px above the frame and `lg:pb-14` adds the empty
          padding the frame then covers, so it reads as a layer tucked behind the
          courier. The frame carries `z-20`, so the panel is always the lower
          layer. Note the offset is a top margin, not a bottom one: `margin-bottom`
          does not move a `top`-anchored absolute box. */}
      <RoutePanel
        className={cn(
          "absolute inset-x-0 top-0 z-0 hidden lg:-top-20 lg:block lg:pb-14",
          "lg:left-[-1rem]",
        )}
      />

      {/* ------------------------------------------------------- photograph */}
      <HeroReveal preset="feature" className="relative">
        <div
          className={cn(
            "relative z-20 aspect-[3/2] w-full overflow-hidden border border-white/65 bg-card/25 shadow-overlay",
            "rounded-[28px]",
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            preload
            fetchPriority="high"
            quality={82}
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 58vw, 58vw"
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: image.objectPosition }}
          />

          <CourierVeil />

          {/* Status stack — the three supporting cards from §11, aligned
              vertically against the right edge. The wrapper is `display: none`
              below 1200px, so the in-flow instance below is the only one in the
              accessibility tree at those widths. `aria-hidden` because the
              screen-reader summary at the foot of this component reads the same
              three facts. */}
          <div
            className="pointer-events-none absolute inset-0 hidden min-[1200px]:block"
            aria-hidden="true"
          >
            <DeliveryStatusCards
              variant="compact"
              className="absolute bottom-5 right-5 w-[168px] min-[1440px]:w-[184px] 2xl:w-[192px]"
            />
          </div>
        </div>
      </HeroReveal>

      {/* Route panel, in flow — below `lg` only, where the floating instance is
          `display: none`. The two are never on screen at the same time, so the
          route is described to assistive tech exactly once at every width. */}
      <div className="relative z-10 mb-4 lg:hidden">
        <RoutePanel />
      </div>

      {/* ------------------------------------------------ primary tracking card
          Overhangs the frame's left edge from 1200px, bridging the two columns.

          The overhang is 40px against a 48px grid gap, and that inequality is the
          point: while it holds, the card's left edge stays inside the gap and
          physically cannot reach the copy column, whatever the heading size or
          text measure turn out to be. A larger overhang looks marginally more
          "layered" but couples the card's position to the copy column's width —
          at 1200px that column is only 457px, so a 72px overhang lands on the
          heading. Do not raise this past the gap without re-checking. */}
      <LiveTrackingCard className="mt-4 min-[1200px]:absolute min-[1200px]:left-[-2.5rem] min-[1200px]:top-1/2 min-[1200px]:z-30 min-[1200px]:mt-0 min-[1200px]:w-[260px] min-[1200px]:-translate-y-1/2 min-[1440px]:w-[288px]" />

      {/* ------------- below 1200px the status cards sit out of the frame, in a
          full-width stack. */}
      <HeroReveal className="mt-4 min-[1200px]:hidden">
        <DeliveryStatusCards />
      </HeroReveal>

      {/* One plain-language reading of everything the overlays show. */}
      <p className="sr-only">
        {`${HERO_SAMPLE_ROUTE.headline}. ${HERO_SAMPLE_ROUTE.detail}. ` +
          `Collected from ${HERO_SAMPLE_ROUTE.pickup.place}, heading to ` +
          `${HERO_SAMPLE_ROUTE.destination.place}. ` +
          `${HERO_SAMPLE_ROUTE.progressPercent} percent complete, ` +
          `estimated arrival ${HERO_SAMPLE_ROUTE.etaValue}, ` +
          `${HERO_SAMPLE_ROUTE.distanceValue} remaining. ` +
          HERO_SAMPLE_ROUTE.disclaimer +
          "."}
      </p>
    </div>
  );
}
