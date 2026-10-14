"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role, User } from "@/types";

/* -------------------------------------------------------------------------- */
/*                                Auth store                                  */
/* -------------------------------------------------------------------------- */

interface AuthState {
  user: User | null;
  role: Role | null;
  /** Set once /auth/me has resolved — prevents route flicker. */
  resolved: boolean;
  setSession: (user: User | null) => void;
  setResolved: (resolved: boolean) => void;
  patchUser: (patch: Partial<User>) => void;
  clear: () => void;
}

/**
 * The user object is cached for optimistic UI only.
 * It is NEVER a source of authorization truth — the NestJS API always
 * re-validates the HTTP-only cookie on every request.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  role: null,
  resolved: false,
  setSession: (user) => set({ user, role: user?.role ?? null, resolved: true }),
  setResolved: (resolved) => set({ resolved }),
  patchUser: (patch) =>
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...patch };
      return { user, role: user.role };
    }),
  clear: () => set({ user: null, role: null, resolved: true }),
}));

/* -------------------------------------------------------------------------- */
/*                                Theme store                                 */
/* -------------------------------------------------------------------------- */

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    { name: "grx-theme", storage: createJSONStorage(() => localStorage) },
  ),
);

/* -------------------------------------------------------------------------- */
/*                                 UI store                                   */
/* -------------------------------------------------------------------------- */

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandMenuOpen: boolean;
  notificationsOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setCommandMenuOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandMenuOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setCommandMenuOpen: (commandMenuOpen) => set({ commandMenuOpen }),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
}));
