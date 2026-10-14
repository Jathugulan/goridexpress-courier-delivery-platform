"use client";

import * as React from "react";
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "@/hooks/use-media-query";

export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop };

/** Debounce a rapidly changing value (search inputs, resize handlers). */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** True once the element has been mounted in the browser. */
export function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/** Copy text to clipboard with a transient "copied" flag. */
export function useCopyToClipboard(resetMs = 1800) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = React.useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const el = document.createElement("textarea");
          el.value = text;
          el.style.position = "fixed";
          el.style.opacity = "0";
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        setCopied(true);
        window.clearTimeout(timeout.current);
        timeout.current = window.setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  return { copied, copy };
}

/** Locks body scroll while `active` (dialogs, sheets, mobile nav). */
export function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = original;
      document.body.style.paddingRight = "";
    };
  }, [active]);
}

/** Fires a callback when a click lands outside the referenced element. */
export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true,
) {
  React.useEffect(() => {
    if (!enabled) return;
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}

/**
 * Returns a stable callback that always calls the latest closure.
 */
export function useEvent<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = React.useRef(fn);
  React.useLayoutEffect(() => {
    ref.current = fn;
  });
  return React.useCallback(((...args: never[]) => ref.current(...args)) as T, []);
}

/** Persisted small preference (table density, view mode, map zoom…). */
export function useLocalPreference<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(initial);
  const keyRef = React.useRef(key);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (keyRef.current !== key) {
      keyRef.current = key;
      try {
        const raw = window.localStorage.getItem(`grx:pref:${key}`);
        setValue(raw ? (JSON.parse(raw) as T) : initial);
        return;
      } catch {
        /* noop */
      }
    }
    try {
      const raw = window.localStorage.getItem(`grx:pref:${key}`);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(`grx:pref:${keyRef.current}`, JSON.stringify(resolved));
        } catch {
          /* noop */
        }
        return resolved;
      });
    },
    [],
  );

  return [value, update] as const;
}

/** Counts up to a target value for KPI animations. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = React.useState(0);
  const frame = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

/** Sets document title with a page prefix (client-side navigation). */
export function useDocumentTitle(title?: string) {
  React.useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title} · GoRideXpress`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
