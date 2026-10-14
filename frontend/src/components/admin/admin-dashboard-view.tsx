"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bike,
  CircleDollarSign,
  Clock,
  Headphones,
  LifeBuoy,
  Package,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  useAdminDashboard,
  useOperationsSnapshot,
  useAdminTickets,
  useAdminDeliveries,
} from "@/hooks/admin-queries";
import { useDebouncedValue } from "@/components/shared/filters";
import { formatCurrency, formatNumber, formatRelative, formatTime } from "@/lib/format";
import { orderMeta } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, QuickActionCard } from "@/components/shared/cards";
import { DataState, ListEmptyState, StatsLoadingSkeleton } from "@/components/shared/filters";
import {
  OrderStatusBadge,
  CourierStatusBadge,
  TicketStatusBadge,
  DemoTag,
} from "@/components/shared/status";
import { LiveOperationsMap, LiveConnectionChip } from "@/components/shared/tracking-map";
import { formatDistance } from "@/lib/format";

export function AdminDashboardView() {
  const { data, isPending, isError, error, refetch, isFetching } = useAdminDashboard();
  const { data: snapshot } = useOperationsSnapshot();
  const { data: tickets } = useAdminTickets({ page: 1, limit: 4 });
  const { data: recent } = useAdminDeliveries({ page: 1, limit: 6 });

  const metrics = data?.metrics;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Operations overview</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Live platform health for GoRideXpress demo operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveConnectionChip connected={Boolean(snapshot)} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden="true" />
            Refresh
          </Button>
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

      {isPending || !metrics ? (
        <StatsLoadingSkeleton count={8} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Demo revenue"
              value={formatCurrency(metrics.demoRevenue)}
              hint={`${formatCurrency(metrics.demoRevenueToday)} today`}
              icon={CircleDollarSign}
              tone="primary"
            />
            <StatCard
              label="Active deliveries"
              value={metrics.activeDeliveries}
              hint={`${metrics.completedDeliveries} completed`}
              icon={Package}
              tone="info"
            />
            <StatCard
              label="Available couriers"
              value={metrics.availableCouriers}
              hint={`${metrics.busyCouriers} busy · ${metrics.totalCouriers} total`}
              icon={Bike}
              tone="success"
            />
            <StatCard
              label="Open tickets"
              value={metrics.openTickets}
              hint={`${metrics.pendingPayments} payments pending`}
              icon={Headphones}
              tone={metrics.openTickets > 0 ? "warning" : "success"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Orders"
              value={formatNumber(metrics.totalOrders)}
              hint={`${metrics.ordersToday} today`}
              icon={TrendingUp}
            />
            <StatCard
              label="Customers"
              value={formatNumber(metrics.totalCustomers)}
              hint={`${metrics.newCustomersThisMonth} new this month`}
              icon={Users}
            />
            <StatCard
              label="Avg delivery time"
              value={`${Math.round(metrics.averageDeliveryMinutes)} min`}
              hint={`${metrics.averageRating.toFixed(1)}★ average rating`}
              icon={Clock}
            />
            <StatCard
              label="Delayed"
              value={metrics.delayedDeliveries}
              hint={`${metrics.failedDeliveries} failed`}
              icon={AlertTriangle}
              tone={metrics.delayedDeliveries > 0 ? "warning" : "success"}
            />
          </div>
        </>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card padding="none" className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b border-line">
            <CardTitle as="h2" className="text-sm">
              Live delivery board
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/deliveries/live">
                Open board
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {snapshot && snapshot.deliveries.length > 0 ? (
              <>
                <LiveOperationsMap deliveries={snapshot.deliveries} height="md" />
                <ul className="divide-y divide-line">
                  {snapshot.deliveries.slice(0, 5).map((delivery) => (
                    <li key={delivery.deliveryId} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-semibold text-ink">
                          {delivery.orderId}
                        </p>
                        <p className="truncate text-[11px] text-ink-muted">
                          {delivery.courierName || "Unassigned"} · {delivery.customerName}
                        </p>
                      </div>
                      <OrderStatusBadge status={delivery.status} />
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="p-4">
                <ListEmptyState
                  compact
                  icon={Package}
                  title="No live deliveries"
                  description="Active deliveries appear here as couriers accept jobs."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-sm">
                Fleet status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot?.couriers?.length ? (
                <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                  {snapshot.couriers.slice(0, 8).map((courier) => (
                    <li
                      key={courier.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="min-w-0 truncate text-sm text-ink">
                        {courier.firstName} {courier.lastName}
                      </span>
                      <CourierStatusBadge status={courier.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No couriers online.</p>
              )}
              {snapshot ? (
                <p className="border-t border-line pt-2 text-[11px] text-ink-muted">
                  Updated {formatRelative(snapshot.updatedAt)} at {formatTime(snapshot.updatedAt)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-sm">
                Support queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets?.items?.length ? (
                <ul className="space-y-1.5">
                  {tickets.items.map((ticket) => (
                    <li key={ticket.id} className="rounded-lg border border-line p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                          {ticket.subject}
                        </p>
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                        {ticket.customerName} · {ticket.category}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No open tickets. Nice work.</p>
              )}
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link href="/admin/support">
                  <LifeBuoy className="size-3.5" aria-hidden="true" />
                  Manage tickets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Recent deliveries</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              All orders
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <DataState
          isLoading={false}
          error={null}
          isEmpty={!recent?.items?.length}
          suppressEmpty
          skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
          empty={
            <ListEmptyState
              icon={Package}
              title="No deliveries yet"
              description="Bookings from the customer app will show up here."
            />
          }
        >
          <span />
        </DataState>

        {recent?.items?.length ? (
          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {recent.items.map((delivery) => (
              <li key={delivery.id}>
                <Card padding="md" interactive="hover" className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold text-ink">
                        {delivery.trackingCode || delivery.id}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {delivery.serviceType.replace(/_/g, " ").toLowerCase()} ·{" "}
                        {formatDistance(delivery.distanceKm)}
                      </p>
                    </div>
                    <OrderStatusBadge status={delivery.status} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/admin/orders"
          title="Orders"
          description="Assign couriers and advance statuses"
          icon={Package}
        />
        <QuickActionCard
          href="/admin/deliveries/live"
          title="Live board"
          description="Watch every active delivery"
          icon={TrendingUp}
        />
        <QuickActionCard
          href="/admin/couriers"
          title="Couriers"
          description="Approve, suspend and assign vehicles"
          icon={UserCheck}
        />
        <QuickActionCard
          href="/admin/analytics"
          title="Analytics"
          description="Revenue, trends and heatmaps"
          icon={TrendingUp}
        />
      </div>

      <p className="flex items-center justify-center gap-2 text-[11px] text-ink-muted">
        <Badge variant="neutral" size="sm">
          <DemoTag />
        </Badge>
        All figures above are simulated demo data.
      </p>
    </div>
  );
}
