/**
 * GoRideXpress design system constants.
 * Single source of truth for the UI/UX design specification.
 * See SRS § Design System, § Responsive UX, § UI Components.
 */

/* -------------------------------------------------------------------------- */
/*                                  Breakpoints                               */
/* -------------------------------------------------------------------------- */

export const BREAKPOINTS = {
  xs: 320,
  sm: 375,
  md: 390,
  base: 430,
  lg: 768,
  xl: 1024,
  "2xl": 1280,
  "3xl": 1440,
  "4xl": 1600,
  "5xl": 1920,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const BREAKPOINT_LABELS: Record<BreakpointKey, string> = {
  xs: "320px — Small phone",
  sm: "375px — Phone",
  md: "390px — Large phone",
  base: "430px — XL phone",
  lg: "768px — Tablet",
  xl: "1024px — Tablet landscape / Small laptop",
  "2xl": "1280px — Laptop",
  "3xl": "1440px — Desktop",
  "4xl": "1600px — Large desktop",
  "5xl": "1920px — XL desktop",
};

/* -------------------------------------------------------------------------- */
/*                                Layout container                            */
/* -------------------------------------------------------------------------- */

export const CONTAINER = {
  /** Public marketing pages */
  marketing: "max-w-7xl",
  /** Application content (customer / admin) */
  app: "max-w-[1440px]",
  /** Read-heavy content */
  prose: "max-w-3xl",
  /** Full-bleed (tracking maps) */
  full: "max-w-none",
} as const;

export const GUTTER = {
  mobile: "px-4",
  tablet: "px-5",
  desktop: "px-6",
  wide: "px-8",
} as const;

/* -------------------------------------------------------------------------- */
/*                                   Spacing                                  */
/* -------------------------------------------------------------------------- */

export const SPACE = {
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
  "4xl": "4rem",
} as const;

/* -------------------------------------------------------------------------- */
/*                                    Radii                                   */
/* -------------------------------------------------------------------------- */

export const RADIUS = {
  control: "rounded-[10px]",
  button: "rounded-[11px]",
  input: "rounded-[10px]",
  card: "rounded-2xl",
  container: "rounded-3xl",
  hero: "rounded-[28px]",
  pill: "rounded-full",
} as const;

/* -------------------------------------------------------------------------- */
/*                                    Shadows                                 */
/* -------------------------------------------------------------------------- */

export const SHADOW = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  card: "shadow-card",
  elevated: "shadow-elevated",
  overlay: "shadow-overlay",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Motion                                    */
/* -------------------------------------------------------------------------- */

export const MOTION = {
  fast: { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const },
  base: { duration: 0.24, ease: [0.16, 1, 0.3, 1] as const },
  slow: { duration: 0.36, ease: [0.16, 1, 0.3, 1] as const },
  spring: { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.7 },
  springSoft: { type: "spring" as const, stiffness: 220, damping: 28 },
} as const;

export const STAGGER = 0.045;

/* -------------------------------------------------------------------------- */
/*                              Control heights                               */
/* -------------------------------------------------------------------------- */

export const CONTROL_HEIGHT = {
  sm: "h-9",
  md: "h-11",
  lg: "h-12",
} as const;

/* -------------------------------------------------------------------------- */
/*                              Map card heights                              */
/* -------------------------------------------------------------------------- */

export const MAP_HEIGHT = {
  mobile: "h-[320px] sm:h-[340px]",
  tablet: "h-[400px]",
  desktop: "h-[480px] lg:h-[520px] xl:h-[540px]",
} as const;

/** Size-prop heights for map components. */
export const MAP_SIZE = {
  sm: "h-[220px] sm:h-[240px]",
  md: "h-[320px] sm:h-[360px] lg:h-[400px]",
  lg: "h-[400px] sm:h-[440px] lg:h-[520px] xl:h-[560px]",
  xl: "h-[460px] sm:h-[520px] lg:h-[620px] xl:h-[680px]",
} as const;

/* -------------------------------------------------------------------------- */
/*                                 z-index map                                */
/* -------------------------------------------------------------------------- */

export const Z_INDEX = {
  base: 0,
  raised: 10,
  sticky: 30,
  header: 40,
  drawer: 50,
  overlay: 60,
  modal: 70,
  toast: 100,
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Currency                                  */
/* -------------------------------------------------------------------------- */

export const CURRENCY = {
  code: "USD",
  symbol: "$",
} as const;

/** Demo wallet top-up amounts (SRS § Dummy Wallet) */
export const DEMO_TOPUP_AMOUNTS = [10, 25, 50, 100] as const;

/* -------------------------------------------------------------------------- */
/*                              Public navigation                             */
/* -------------------------------------------------------------------------- */

/**
 * Primary marketing navigation. Also drives the mobile sheet and the command
 * palette, so every entry carries a short description.
 */
export const PUBLIC_NAV_LINKS = [
  { label: "Home", href: "/", description: "Fast. Safe. Reliable." },
  { label: "Services", href: "/services", description: "Instant, same-day and scheduled" },
  { label: "Track Delivery", href: "/track", description: "Follow your parcel live" },
  { label: "About", href: "/about", description: "Who we are and how we work" },
  { label: "Support", href: "/help", description: "Help centre, FAQs and contact" },
] as const;

export const PUBLIC_FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/about#careers" },
      { label: "Contact", href: "/contact" },
      { label: "Business", href: "/business" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Instant Delivery", href: "/services#instant" },
      { label: "Same-Day Delivery", href: "/services#same-day" },
      { label: "Scheduled Delivery", href: "/services#scheduled" },
      { label: "Business & Bulk", href: "/business" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", href: "/track" },
      { label: "Help Center", href: "/help" },
      { label: "FAQ", href: "/faq" },
      { label: "Report an Issue", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Demo Disclaimer", href: "/legal/demo" },
    ],
  },
] as const;

/* -------------------------------------------------------------------------- */
/*                                Demo disclaimer                             */
/* -------------------------------------------------------------------------- */

export const DEMO_NOTICE_SHORT = "Demo mode — no real money";
export const DEMO_NOTICE_FULL =
  "Demo Payment Mode — No real money will be charged. All transactions on GoRideXpress are simulated.";
export const DEMO_RECEIPT_NOTICE = "DEMO TRANSACTION — NO REAL PAYMENT";

/** Demo credentials shown on login / register pages (SRS § Demo Data) */
export const DEMO_CREDENTIALS = {
  customer: { email: "customer@goridexpress.demo", password: "Customer@123" },
  admin: { email: "admin@goridexpress.demo", password: "Admin@123" },
} as const;
