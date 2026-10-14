"use client";

import * as React from "react";
import { useTheme } from "@/components/providers/theme-provider";
import type { Role } from "@/types";
import { useUiStore } from "@/store/auth-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioCard, Switch } from "@/components/ui/input";
import { Alert } from "@/components/ui/states";
import { Monitor, Moon, Sun, Trash2, LogOut, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogout } from "@/hooks/queries";

const MODES = [
  { value: "light" as const, label: "Light", hint: "Always bright", icon: Sun },
  { value: "dark" as const, label: "Dark", hint: "Easy on the eyes", icon: Moon },
  { value: "system" as const, label: "System", hint: "Follow your device", icon: Monitor },
];

const ROLE_COPY: Record<Role, string> = {
  CUSTOMER: "Customer account — book and track deliveries.",
  ADMIN: "Administrator — full operations access.",
};

export function SettingsPanel() {
  const { mode, setMode } = useTheme();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const applyMode = (next: (typeof MODES)[number]["value"]) => setMode(next);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card padding="md">
        <CardHeader>
          <CardTitle as="h2" className="text-sm">
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid gap-2 sm:grid-cols-3"
          >
            {MODES.map((option) => {
              const Icon = option.icon;
              return (
                <RadioCard
                  key={option.value}
                  name="theme-mode"
                  value={option.value}
                  selected={mode === option.value}
                  onChange={() => applyMode(option.value)}
                  icon={<Icon className="size-4 text-primary" aria-hidden="true" />}
                  label={<span className="text-sm font-semibold text-ink">{option.label}</span>}
                  description={
                    <span className="text-[11px] text-ink-muted">{option.hint}</span>
                  }
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
            <div>
              <p className="text-sm font-medium text-ink">Collapse sidebar</p>
              <p className="text-xs text-ink-muted">Show icons only on desktop.</p>
            </div>
            <Switch
              checked={collapsed}
              onCheckedChange={setCollapsed}
              label="Collapse sidebar"
            />
          </div>
        </CardContent>
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle as="h2" className="text-sm">
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-line p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">
                {user ? `${user.firstName} ${user.lastName}` : "Signed in"}
              </p>
              <p className="text-xs text-ink-muted">{user?.email}</p>
              {user ? (
                <p className="mt-1 text-[11px] text-ink-muted">{ROLE_COPY[user.role]}</p>
              ) : null}
            </div>
          </div>

          <Alert tone="info" title="Demo environment" compact>
            Sessions, data and payments in this build are simulated for demonstration.
          </Alert>

          {confirmLogout ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-error/40 bg-error-light/40 p-3 dark:bg-error/10">
              <p className="text-sm text-ink">Sign out of GoRideXpress?</p>
              <Button type="button" variant="danger" size="sm" onClick={() => logout.mutate()}>
                Sign out
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmLogout(false)}
              >
                Stay
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmLogout(true)}
              className={cn("w-full")}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          )}
        </CardContent>
      </Card>

      <Card padding="md" className="lg:col-span-2">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-sm">
            <Trash2 className="size-4 text-primary" aria-hidden="true" />
            Local data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-muted">
            The booking wizard keeps its draft in this browser session only. Clearing site data
            removes it, along with your saved theme and sidebar preference.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem("grx-delivery-wizard");
              window.location.reload();
            }}
          >
            Clear booking draft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
