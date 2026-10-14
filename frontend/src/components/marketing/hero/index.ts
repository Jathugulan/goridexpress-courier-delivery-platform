/**
 * Home page hero.
 *
 * Every part is independently reusable — a campaign page can compose
 * `HeroBadge`, `CourierVisual` and `LiveTrackingCard` on their own, or replace
 * any slot on `HeroSection` through its props.
 */

export { HeroSection, type HeroSectionProps } from "./hero-section";
export { HeroBadge, type HeroBadgeProps } from "./hero-badge";
export { HeroContent, type HeroContentProps } from "./hero-content";
export { HeroActions, type HeroActionsProps } from "./hero-actions";
export { TrustIndicators, type TrustIndicatorsProps } from "./trust-indicators";
export { CourierVisual, type CourierVisualProps } from "./courier-visual";
export { RoutePanel, type RoutePanelProps } from "./route-panel";
export {
  DeliveryProgress,
  LiveTrackingCard,
  type DeliveryProgressProps,
  type LiveTrackingCardProps,
} from "./live-tracking-card";
export { LiveBadge, SampleDataNote, type LiveBadgeProps } from "./live-badge";
export {
  DeliveryStatusCards,
  type DeliveryStatusCardsProps,
} from "./delivery-status-cards";
export { HeroFeatureBar, type HeroFeatureBarProps } from "./hero-feature-bar";
export {
  HERO_EASE,
  HeroReveal,
  heroContainer,
  heroFeature,
  heroItem,
  type HeroRevealProps,
} from "./motion";
