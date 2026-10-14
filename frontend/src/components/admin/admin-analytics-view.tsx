"use client";

import * as React from "react";
import { Activity, CircleDollarSign, Clock, Gauge, Package, Users } from "lucide-react";
import { useAnalyticsFull } from "@/hooks/admin-queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkeletonChart } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/cards";
import { DemoTag } from "@/components/shared/status";
import {
  TrendAreaChart,
  CategoryBarChart,
  DonutChart,
  MultiLineChart,
  CHART_COLORS,
} from "@/components/shared/charts";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type RangeKey = "7d" | "30d" | "90d";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

function buildRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    label: `Last ${days} days`,
  };
}

export function AdminAnalyticsView() {
  const [range, setRange] = React.useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const params = React.useMemo(() => buildRange(days), [days]);

  const { data, isPending, isError, error, refetch } = useAnalyticsFull(params);
  const currency = React.useCallback((v: number) => formatCurrency(v), []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Revenue, delivery and fleet performance across the platform.
          </p>
        </div>
        <div
          role="group"
          aria-label="Date range"
          className="flex rounded-xl border border-line bg-card p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                range === r.key
                  ? "bg-primary text-white"
                  : "text-ink-muted hover:bg-muted hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <Card padding="lg">
          <ErrorState
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </Card>
      ) : null}

      {isPending || !data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <SkeletonChart height={240} />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Demo revenue"
              value={formatCurrency(data.payments.demoRevenue)}
              hint={`${formatCurrency(data.overview.demoRevenueToday)} today`}
              icon={CircleDollarSign}
              tone="primary"
            />
            <StatCard
              label="Orders"
              value={formatNumber(data.orders.total)}
              hint={`${data.orders.completed} completed · ${data.orders.cancelled} cancelled`}
              icon={Package}
              tone="info"
            />
            <StatCard
              label="Customers"
              value={formatNumber(data.customers.total)}
              hint={`${data.customers.newThisMonth} new this month`}
              icon={Users}
              tone="success"
            />
            <StatCard
              label="Avg delivery"
              value={`${Math.round(data.deliveries.averageMinutes)} min`}
              hint={`${formatNumber(data.deliveries.averageDistanceKm)} km avg`}
              icon={Clock}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Revenue trend
                </CardTitle>
                <CardDescription>Simulated daily revenue for the selected range.</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendAreaChart
                  data={data.payments.daily}
                  valueKey="Revenue"
                  dataKey="value"
                  color={CHART_COLORS[0]}
                  valueFormatter={currency}
                />
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Orders per day
                </CardTitle>
                <CardDescription>Total orders created each day.</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendAreaChart
                  data={data.orders.daily}
                  valueKey="Orders"
                  dataKey="value"
                  color={CHART_COLORS[1]}
                />
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Orders by status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={data.orders.byStatus}
                  centerValue={formatNumber(data.orders.total)}
                  centerLabel="orders"
                />
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Revenue by payment method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={data.payments.byMethod}
                  valueFormatter={currency}
                  centerValue={formatCurrency(data.payments.demoRevenue)}
                  centerLabel="demo revenue"
                />
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Orders by service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBarChart data={data.orders.byService} horizontal />
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Deliveries by vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBarChart data={data.deliveries.byVehicle} horizontal />
              </CardContent>
            </Card>
          </div>

          <Card padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-sm">
                New vs returning customers
              </CardTitle>
              <CardDescription>
                {data.customers.returning} returning customers in this range.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiLineChart
                data={data.customers.daily.map((point) => ({
                  label: point.label,
                  signups: point.value,
                  cumulative: data.customers.daily
                    .slice(0, data.customers.daily.indexOf(point) + 1)
                    .reduce((sum, p) => sum + p.value, 0),
                }))}
                series={[
                  { key: "signups", label: "New customers", color: CHART_COLORS[0] },
                  { key: "cumulative", label: "Cumulative", color: CHART_COLORS[4] },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Fleet overview
                </CardTitle>
                <CardDescription>
                  {data.couriers.online} online · {data.couriers.busy} busy ·{" "}
                  {data.couriers.averageRating.toFixed(1)}★ average
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.couriers.performance.slice(0, 5).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{row.name}</p>
                      <p className="text-[11px] text-ink-muted">
                        {row.deliveries} deliveries · {row.onTimeRate.toFixed(0)}% on time
                      </p>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {row.rating.toFixed(1)}★
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="flex items-center gap-2 text-sm">
                  <Activity className="size-4" aria-hidden="true" />
                  Demand hotspots
                </CardTitle>
                <CardDescription>Top pickup and drop-off areas by volume.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.heatmap.length === 0 ? (
                  <p className="text-sm text-ink-muted">No hotspot data in this range.</p>
                ) : (
                  <ul className="max-h-72 space-y-2 overflow-y-auto">
                    {data.heatmap.slice(0, 8).map((point) => (
                      <li
                        key={`${point.latitude}-${point.longitude}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {point.pickups + point.dropoffs} stops
                          </p>
                          <p className="truncate text-[11px] text-ink-muted">
                            {point.pickups} pickups · {point.dropoffs} drop-offs
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                          <Gauge className="size-3.5" aria-hidden="true" />
                          {Math.round(point.weight * 100)}%
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="flex items-center justify-center gap-2 text-[11px] text-ink-muted">
            <Badge variant="neutral" size="sm">
              <DemoTag />
            </Badge>
            Analytics are generated from demo data and are not real financial reporting.
          </p>
        </>
      )}
    </div>
  );
}
