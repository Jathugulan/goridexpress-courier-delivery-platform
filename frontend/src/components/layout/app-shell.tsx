"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { roleHome } from "@/lib/api/auth";
import type { Role } from "@/types";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar, DemoBanner } from "./app-topbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ForbiddenState } from "@/components/ui/states";

/**
 * Authenticated application shell.
 *
 * The cookie is the only authorization truth — the Zustand store is used for
 * optimistic UI, so a page can never be "unlocked" by tampering with client
 * state. While `/auth/me` is unresolved we hold a neutral loading state
 * instead of redirecting, which avoids bouncing signed-in users on refresh.
 */
export function AppShell({
  requiredRole,
  title,
  description,
  actions,
  children,
  showDemoBanner = true,
}: {
  requiredRole: Role;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  showDemoBanner?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const resolved = useAuthStore((s) => s.resolved);

  const wrongRole = resolved && role !== null && role !== requiredRole;

  React.useEffect(() => {
    if (resolved && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [resolved, user, pathname, router]);

  if (!resolved && !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-app-bg">
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-ink-muted" role="status">
          Checking your session…
        </p>
      </div>
    );
  }

  if (!user) return null;

  if (wrongRole) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app-bg px-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          <ForbiddenState
            description={`This page is only available to ${requiredRole === "ADMIN" ? "administrators" : "customers"}.`}
            action={
              <Button onClick={() => router.replace(roleHome(role))}>
                <ShieldAlert aria-hidden="true" />
                Go to my dashboard
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-app-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line lg:block">
        <AppSidebar className="h-full" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {showDemoBanner ? <DemoBanner /> : null}
        <AppTopbar title={title} description={description} actions={actions} />

        <main id="main-content" className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppPageEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return <EmptyState title={title} description={description} action={action} />;
}
