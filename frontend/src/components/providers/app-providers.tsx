"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/display";
import { ThemeProvider, useTheme } from "./theme-provider";
import { LiveToastStack, RealtimeBridge } from "./realtime-bridge";
import { useCurrentUser } from "@/hooks/queries";
import { QUERY_DEFAULTS } from "@/hooks/query-keys";
import { useAuthStore } from "@/store/auth-store";

/* -------------------------------------------------------------------------- */
/*                          Session bootstrap                                */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the session from the HTTP-only cookie on every app load.
 * The store is only an optimistic cache — the API remains authoritative.
 */
function AuthBootstrap() {
  const resolved = useAuthStore((s) => s.resolved);
  // `!resolved || true` is always true, so the query stayed permanently
  // enabled: a signed-out visitor re-probed `/auth/me` on every window focus
  // and reconnect, and each probe dragged a `/auth/refresh` behind it. Gating on
  // `!resolved` probes once per app load, which is what the doc comment above
  // describes.
  const { isError } = useCurrentUser({ enabled: !resolved });

  React.useEffect(() => {
    if (isError) useAuthStore.getState().setResolved(true);
  }, [isError]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                              Sonner theming                               */
/* -------------------------------------------------------------------------- */

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      duration={4200}
      offset={72}
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-line bg-card text-ink shadow-elevated text-sm font-medium",
          description: "text-ink-muted text-xs",
          actionButton: "bg-primary text-white rounded-lg text-xs font-semibold",
          cancelButton: "bg-muted text-ink-secondary rounded-lg text-xs",
        },
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                              Query client                                 */
/* -------------------------------------------------------------------------- */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULTS.staleTime,
        gcTime: QUERY_DEFAULTS.gcTime,
        retry: QUERY_DEFAULTS.retry,
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        refetchOnReconnect: QUERY_DEFAULTS.refetchOnReconnect,
      },
      mutations: { retry: 0 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

/* -------------------------------------------------------------------------- */
/*                               Root provider                               */
/* -------------------------------------------------------------------------- */

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200} skipDelayDuration={300}>
          <AuthBootstrap />
          <RealtimeBridge />
          {children}
          <ThemedToaster />
          <LiveToastStack />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
