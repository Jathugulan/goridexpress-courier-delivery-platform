/**
 * Home page hero content.
 *
 * Single source of truth for every string, figure and icon rendered by
 * `components/marketing/hero`. Keeping copy out of the components makes the
 * hero reusable (a campaign page can pass different content) and keeps the
 * components free of hard-coded product claims.
 *
 * The route figures below are illustrative sample data for the marketing
 * hero only — they are not customer records and are never sent to the API.
 */

import {
  CheckCircle2,
  Clock3,
  MapPinned,
  Package,
  Route,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                    Brand                                   */
/* -------------------------------------------------------------------------- */

export const HERO_BRAND = {
  name: "GoRideXpress",
  tagline: "Fast. Safe. Reliable.",
} as const;

/* -------------------------------------------------------------------------- */
/*                                    Badge                                   */
/* -------------------------------------------------------------------------- */

/**
 * Brand tagline, set as a small letter-spaced eyebrow above the badge.
 *
 * The `<h1>` is "Your Delivery. In Motion." — the tagline used to be the
 * headline, so it needs an explicit home now or it silently disappears from the
 * page. An eyebrow is the only slot that carries brand voice without competing
 * with the heading for attention.
 */
export const HERO_EYEBROW = {
  label: HERO_BRAND.tagline,
} as const;

export const HERO_BADGE: { icon: LucideIcon; label: string } = {
  icon: Truck,
  label: "Smart Courier Delivery",
};

/* -------------------------------------------------------------------------- */
/*                                   Heading                                  */
/* -------------------------------------------------------------------------- */

/**
 * Rendered one line per entry. `accent` marks the single blue word that carries
 * the brand colour — never more than one, so the hierarchy stays obvious.
 */
export const HERO_HEADING: readonly { word: string; accent: boolean }[] = [
  { word: "Your Delivery.", accent: false },
  { word: "In Motion.", accent: true },
];

export const HERO_DESCRIPTION =
  "Fast, reliable courier delivery with real-time tracking, transparent pricing, and a seamless booking experience.";

/* -------------------------------------------------------------------------- */
/*                                    CTAs                                    */
/* -------------------------------------------------------------------------- */

export const HERO_ACTIONS: {
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
} = {
  primary: { label: "Book a Delivery", href: "/customer/delivery/create" },
  secondary: { label: "Track Delivery", href: "/track" },
};

/* -------------------------------------------------------------------------- */
/*                             Trust indicators                               */
/* -------------------------------------------------------------------------- */

/**
 * Reassurance points under the CTAs.
 *
 * Every entry uses the same green tick — the shape and the text label carry the
 * meaning, so colour is never the only signal, and the row reads as one set
 * rather than three competing badges.
 */
export const HERO_TRUST: readonly { icon: LucideIcon; label: string }[] = [
  { icon: CheckCircle2, label: "Real-Time Tracking" },
  { icon: CheckCircle2, label: "Secure Booking" },
  { icon: CheckCircle2, label: "Transparent Pricing" },
];

/* -------------------------------------------------------------------------- */
/*                              Sample live route                             */
/* -------------------------------------------------------------------------- */

/**
 * Illustrative delivery used to demonstrate the live-tracking UI. Addresses are
 * fictional place names, not customer data.
 *
 * The status figures also feed `HERO_STATUS_CARDS` below, so the floating cards
 * and the route panel can never disagree with each other.
 */
export const HERO_SAMPLE_ROUTE = {
  headline: "Courier is on the way",
  detail: "Your package is in transit",
  progressPercent: 72,
  etaLabel: "ETA",
  etaValue: "18 min",
  distanceLabel: "Distance",
  distanceValue: "4.6 km",
  pickup: { label: "Pickup", place: "Central City" },
  destination: { label: "Destination", place: "Riverside Mall" },
  /** Rendered on the route panel so the map is never read as real data. */
  disclaimer: "Sample route — demonstration data",
} as const;

/**
 * Compact status stack shown beside the courier.
 *
 * `done` adds the completion tick to the picked-up card. It is a real state, not
 * decoration: the same information is in the progress bar and the screen-reader
 * summary in `CourierVisual`.
 */
export const HERO_STATUS_CARDS: readonly {
  icon: LucideIcon;
  tone: "blue" | "green";
  title: string;
  value: string;
  done?: boolean;
}[] = [
  { icon: Package, tone: "green", title: "Package Picked Up", value: "2 min ago", done: true },
  { icon: Clock3, tone: "blue", title: "Estimated Arrival", value: "18 min" },
  { icon: Route, tone: "blue", title: "Distance", value: "4.6 km" },
];

/* -------------------------------------------------------------------------- */
/*                                Courier image                               */
/* -------------------------------------------------------------------------- */

/**
 * LCP asset for the hero — the courier is the page's primary visual subject, so
 * this is the largest paint on the screen and is preloaded.
 *
 * Photograph from Unsplash, used under the Unsplash License (free for commercial
 * and non-commercial use, no attribution required).
 * https://unsplash.com/photos/delivery-person-on-a-scooter-with-a-green-grab-bag-xa5-9RA-uBE
 *
 * Chosen because the asset is 3:2 (2400 × 1600) and `CourierVisual` frames it at
 * `aspect-[3/2]` — an exact match, so `object-cover` performs **no cropping at
 * all** and the rider, helmet, delivery box and both wheels stay whole. That
 * matters because §19 forbids awkward crops of exactly those parts.
 *
 * Every delivery-courier stock photo found on Pexels was 2:3 portrait, which
 * would have had to be cropped to roughly half its width to sit in a landscape
 * frame — the defect this asset replaces. A 16:9 Pexels scooter rider fitted the
 * frame, but had no delivery box and so read as a commuter rather than a
 * courier.
 *
 * There are no brand marks on the scooter or the box. Overlaying a wordmark was
 * considered and rejected: the decal cannot be aligned to the box without
 * seeing the photograph, and a misaligned logo is worse than none.
 */
export const HERO_COURIER_IMAGE = {
  src: "/images/hero-courier.jpg",
  /** Intrinsic size of the stored asset — prevents layout shift. */
  width: 2400,
  height: 1600,
  /**
   * Describes what the image adds, and claims nothing more. The tracking card
   * beside it carries the delivery facts, so the alt text stays visual — and it
   * does not call him a GoRideXpress courier, because he is not one.
   */
  alt: "Delivery courier in a helmet with a large delivery box, riding a scooter through a city street in daylight",
  /**
   * The source and the frame are both 3:2, so nothing is trimmed and this has no
   * work to do. Centred is therefore correct and safe: there is no crop to bias
   * away from the subject.
   */
  objectPosition: "50% 50%",
  credit: {
    label: "Unsplash",
    href: "https://unsplash.com/photos/delivery-person-on-a-scooter-with-a-green-grab-bag-xa5-9RA-uBE",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                              Feature / stat bar                            */
/* -------------------------------------------------------------------------- */

/**
 * Capability claims only. No invented volume or satisfaction figures — every
 * entry has to stay true without a verified data source.
 */
export const HERO_FEATURES: readonly {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  { icon: Package, title: "Fast Delivery", description: "Get your packages faster" },
  { icon: Clock3, title: "24/7 Service", description: "Always here for you" },
  { icon: MapPinned, title: "Real-Time Tracking", description: "Know where your package is" },
  { icon: ShieldCheck, title: "Transparent Pricing", description: "No hidden charges" },
];

/* -------------------------------------------------------------------------- */
/*                             Decorative accents                             */
/* -------------------------------------------------------------------------- */

export const HERO_ACCENTS = {
  /** Small blue dots behind the copy column. */
  dotPattern: {
    size: "26px 26px",
    dot: "rgba(37, 99, 235, 0.16)",
  },
  /** Very low-contrast curved route line, top right. */
  routePath: "M30 350C150 292 108 138 268 118s186 62 292 -44",
} as const;
