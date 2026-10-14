"use client";

import * as React from "react";
import { useThemeStore } from "@/store/auth-store";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "grx-theme";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

function apply(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolve(mode);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * Inline script that applies the stored theme before first paint,
 * preventing the light/dark flash on reload.
 */
export const themeInitScript = `(function(){try{
var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
var mode=raw?(JSON.parse(raw).state&&JSON.parse(raw).state.mode)||"system":"system";
var dark=mode==="dark"||(mode==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
var el=document.documentElement;
el.classList.toggle("dark",dark);
el.style.colorScheme=dark?"dark":"light";
}catch(e){}})();`;

const ThemeContext = React.createContext<{
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}>({ mode: "system", resolvedTheme: "light", setMode: () => {}, toggle: () => {} });

export function useTheme() {
  return React.useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [systemDark, setSystemDark] = React.useState(false);

  /* Track OS-level changes while in "system" mode. */
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  /* Apply the class whenever the resolved theme changes. */
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  /* Keep the persisted store in sync if another tab changes it. */
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as { state?: { mode?: ThemeMode } };
          if (parsed.state?.mode) useThemeStore.setState({ mode: parsed.state.mode });
        } catch {
          /* ignore malformed storage */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
      toggle: () => setMode(resolvedTheme === "dark" ? "light" : "dark"),
    }),
    [mode, resolvedTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { apply as applyTheme, resolve as resolveTheme };
