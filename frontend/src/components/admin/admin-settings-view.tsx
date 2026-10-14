"use client";

import * as React from "react";
import { History, RotateCcw, Save, ScrollText, Settings2, ShieldAlert } from "lucide-react";
import { useAdminSettings, useUpdateAdminSettings, useAuditLogs } from "@/hooks/admin-queries";
import type { AppSettings } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldLabel, Input, Switch } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { DataState, TableLoadingSkeleton } from "@/components/shared/filters";
import { formatDateTime } from "@/lib/format";

export function AdminSettingsView() {
  const { data, isPending, isError, error, refetch } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();
  const [draft, setDraft] = React.useState<AppSettings | null>(null);
  const [tab, setTab] = React.useState("platform");

  React.useEffect(() => {
    if (data && !draft) setDraft(data);
  }, [data, draft]);

  const dirty = Boolean(data && draft && JSON.stringify(data) !== JSON.stringify(draft));

  if (isError) {
    return (
      <Card padding="lg">
        <ErrorState
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </Card>
    );
  }

  const settings = draft;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Platform settings</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Configure pricing rules, availability and support contact details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDraft(data ?? null)}
              disabled={updateSettings.isPending}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Discard
            </Button>
          ) : null}
          <Button
            type="button"
            loading={updateSettings.isPending}
            disabled={!dirty || !settings}
            onClick={() => settings && updateSettings.mutate(settings)}
          >
            {!updateSettings.isPending ? <Save className="size-3.5" aria-hidden="true" /> : null}
            Save changes
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="platform">
            <Settings2 className="size-4" aria-hidden="true" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="availability">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="size-4" aria-hidden="true" />
            Audit log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-4 space-y-4">
          {isPending || !settings ? (
            <Card padding="md" className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </Card>
          ) : (
            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Support &amp; pricing
                </CardTitle>
                <CardDescription>
                  These values are shown across the customer app and on invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="set-support-email">Support email</FieldLabel>
                    <Input
                      id="set-support-email"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setDraft({ ...settings, supportEmail: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="set-support-phone">Support phone</FieldLabel>
                    <Input
                      id="set-support-phone"
                      value={settings.supportPhone}
                      onChange={(e) => setDraft({ ...settings, supportPhone: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="set-currency">Default currency</FieldLabel>
                    <select
                      id="set-currency"
                      value={settings.defaultCurrency}
                      onChange={(e) => setDraft({ ...settings, defaultCurrency: e.target.value })}
                      className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <option value="INR">INR — Indian Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="AED">AED — UAE Dirham</option>
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="set-max-weight">Max parcel weight (kg)</FieldLabel>
                    <Input
                      id="set-max-weight"
                      type="number"
                      min={0.5}
                      step={0.5}
                      inputMode="decimal"
                      value={settings.maxWeightKg}
                      onChange={(e) =>
                        setDraft({ ...settings, maxWeightKg: Number(e.target.value) })
                      }
                    />
                    <FieldDescription>
                      Bookings above this chargeable weight are rejected at checkout.
                    </FieldDescription>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="set-tax">Tax rate (%)</FieldLabel>
                    <Input
                      id="set-tax"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      inputMode="decimal"
                      value={settings.taxRate}
                      onChange={(e) => setDraft({ ...settings, taxRate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="set-insurance">Insurance rate (%)</FieldLabel>
                    <Input
                      id="set-insurance"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      inputMode="decimal"
                      value={settings.insuranceRate}
                      onChange={(e) =>
                        setDraft({ ...settings, insuranceRate: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-4 space-y-4">
          {isPending || !settings ? (
            <Card padding="md" className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </Card>
          ) : (
            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Service availability
                </CardTitle>
                <CardDescription>
                  Maintenance mode hides the booking flow for every customer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    {
                      key: "maintenanceMode" as const,
                      label: "Maintenance mode",
                      description: "Block all new deliveries until you turn this off.",
                    },
                    {
                      key: "allowRegistration" as const,
                      label: "Allow new registrations",
                      description: "Let new customers create an account.",
                    },
                    {
                      key: "allowCod" as const,
                      label: "Allow cash on delivery",
                      description: "Show the COD payment method at checkout.",
                    },
                  ] satisfies { key: keyof AppSettings; label: string; description: string }[]
                ).map((row) => (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-line p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{row.label}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{row.description}</p>
                    </div>
                    <Switch
                      checked={Boolean(settings[row.key])}
                      aria-label={row.label}
                      onCheckedChange={(checked) =>
                        setDraft({ ...settings, [row.key]: checked } as AppSettings)
                      }
                    />
                  </div>
                ))}

                {settings.maintenanceMode ? (
                  <p className="flex items-center gap-2 rounded-xl border border-warning/50 bg-warning-light/40 p-3 text-xs text-ink dark:bg-warning/10">
                    <ShieldAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
                    Maintenance mode is active. Save to apply it platform-wide.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditLogTable() {
  const [page, setPage] = React.useState(1);
  const { data, isPending, isError, error, refetch } = useAuditLogs({ page, limit: 20 });
  const logs = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="size-4 text-ink-muted" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink">Recent admin activity</h2>
        {logs.length ? (
          <Badge variant="neutral" size="sm">
            {data?.pagination.total ?? 0} events
          </Badge>
        ) : null}
      </div>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={logs.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={8} cols={4} />}
        empty={
          <p className="py-6 text-center text-sm text-ink-muted">
            No admin activity has been recorded yet.
          </p>
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Audit log"
            headers={[
              { label: "Action" },
              { label: "Admin" },
              { label: "Resource" },
              { label: "When" },
            ]}
          >
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {log.action.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-sm text-ink">{log.userName ?? "—"}</span>
                    <span className="block truncate text-[11px] text-ink-muted">{log.userEmail}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs text-ink">
                      {log.resource}
                      {log.resourceId ? (
                        <span className="ml-1 font-mono text-[11px] text-ink-muted">
                          {log.resourceId}
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">{formatDateTime(log.createdAt)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        </Card>
      </DataState>

      {data ? (
        <PaginationBar
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          label="events"
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
