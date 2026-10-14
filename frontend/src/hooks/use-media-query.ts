"use client";

import * as React from "react";

/**
 * SSR-safe media queries.
 * Returns `false` on the server and during the first client render to avoid
 * hydration mismatches, then settles to the real value in an effect.
 */

const BREAKPOINTS = {
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

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** < 768px — phone layouts, bottom navigation, sheet dialogs. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.lg - 0.02}px)`);
}

/** 768px – 1023px — tablet layouts, collapsible sidebar. */
export function useIsTablet() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 0.02}px)`);
}

/** >= 1024px — full desktop layouts. */
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export { BREAKPOINTS };
