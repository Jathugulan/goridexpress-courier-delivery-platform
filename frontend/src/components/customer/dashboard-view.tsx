"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CircleDollarSign,
  Gift,
  MapPin,
  Package,
  ReceiptIndianRupee,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useCustomerDashboard, useTracking } from "@/hooks/queries";
import type { CustomerDashboard } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, EmptyState, ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderCard, PaymentRow, StatCard } from "@/components/shared/cards";
import { EtaBadge, OrderStatusBadge } from "@/components/shared/status";
import { LiveConnectionChip, TrackingMap } from "@/components/shared/tracking-map";
import { formatCurrency, formatDistance } from "@/lib/format";

const ALERT_COPY: Record<string, { title: string; variant: "warning" | "error" | "info" }> = {
  DELAY: { title: "Your delivery is running late", variant: "warning" },
  INACTIVITY: { title: "No courier movement for a while", variant: "warning" },
  ROUTE_DEVIATION: { title: "The courier has left the planned route", variant: "warning" },
  PAYMENT: { title: "There is a problem with your payment", variant: "error" },
  UNAVAILABLE: { title: "No courier is available right now", variant: "error" },
  ASSIGNMENT_TIMEOUT: { title: "We are still finding a courier", variant: "info" },
};

export function CustomerDashboardView() {
  const user = useAuthStore((s) => s.user);
  const { data, isPending, isError, error, refetch } = useCustomerDashboard();

  if (isPending) return <CustomerDashboardSkeleton />;

  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        description={
          error instanceof Error
            ? error.message
            : "The demo API is not reachable, so dashboard data cannot be shown."
        }
        onRetry={() => void refetch()}
      />
    );
  }

  const { stats, activeDelivery, nextDelivery, recentOrders, recentPayments, alerts, unreadNotifications } =
    data;
  const firstName = data.greeting.firstName || user?.firstName || "there";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            {greetingFor(new Date())}, {firstName}
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
            {activeDelivery ? "Your delivery is on the move" : "Ready to send something?"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadNotifications > 0 ? (
            <Badge variant="primary" size="sm" srLabel="unread notifications">
              <Bell className="size-3" aria-hidden="true" />
              {unreadNotifications} new
            </Badge>
          ) : null}
          <Button asChild>
            <Link href="/customer/delivery/create">
              <Package aria-hidden="true" />
              Send a parcel
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.slice(0, 3).map((alert) => {
            const copy = ALERT_COPY[alert.type] ?? ALERT_COPY.DELAY!;
            return (
              <li key={alert.id}>
                <Alert tone={copy.variant} compact title={copy.title}>
                  {alert.message}
                </Alert>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Active delivery */}
      {activeDelivery ? (
        <ActiveDeliveryPanel delivery={activeDelivery} />
      ) : nextDelivery ? (
        <Card padding="lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                aria-hidden="true"
              >
                <Truck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Next delivery
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold text-ink">
                  {nextDelivery.trackingCode || nextDelivery.id}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={nextDelivery.status} />
                  <EtaBadge
                    minutes={nextDelivery.etaMinutes ?? null}
                    isDelayed={nextDelivery.isDelayed}
                  />
                </div>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={`/customer/orders/${nextDelivery.id}`}>
                View order
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active deliveries"
          value={stats.activeDeliveries}
          icon={Truck}
          tone="primary"
          hint={activeDelivery ? "1 in progress right now" : "Nothing in progress"}
          href="/customer/orders?status=IN_TRANSIT"
        />
        <StatCard
          label="Completed"
          value={stats.completedDeliveries}
          icon={Package}
          tone="success"
          hint={`${stats.totalOrders} orders all time`}
          href="/customer/orders?status=DELIVERED"
        />
        <StatCard
          label="Wallet balance"
          value={formatCurrency(stats.walletBalance)}
          icon={Wallet}
          tone="info"
          hint="Demo balance — no real money"
          href="/customer/wallet"
        />
        <StatCard
          label="Coupons available"
          value={stats.availableCoupons}
          icon={Gift}
          tone="warning"
          hint="Apply at checkout"
          href="/customer/coupons"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: CircleDollarSign,
            label: "Total spent",
            value: formatCurrency(stats.totalSpent),
            note: "Simulated across all orders",
            href: "/customer/payments",
          },
          {
            icon: MapPin,
            label: "Saved addresses",
            value: stats.savedAddresses,
            note: "Speed up your next booking",
            href: "/customer/profile",
          },
          {
            icon: ReceiptIndianRupee,
            label: "Cancelled orders",
            value: stats.cancelledOrders,
            note: stats.cancelledOrders > 0 ? "Check the reasons" : "Nothing cancelled",
            href: "/customer/orders?status=CANCELLED",
          },
          {
            icon: Bell,
            label: "Unread notifications",
            value: unreadNotifications,
            note: "Status updates and offers",
            href: "/customer/notifications",
          },
        ].map(({ icon: Icon, label, value, note, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink-secondary transition-colors group-hover:bg-primary-light group-hover:text-primary dark:group-hover:bg-primary/20 dark:group-hover:text-primary-light"
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs text-ink-muted">{label}</span>
              <span className="block truncate text-base font-bold tabular-nums text-ink">{value}</span>
              <span className="block truncate text-[11px] text-ink-muted">{note}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Recent orders + payments */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="recent-orders">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 id="recent-orders" className="text-base font-semibold text-ink">
              Recent orders
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/orders">
                View all
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                title="No orders yet"
                description="Book your first delivery and it will appear here with live tracking."
                action={
                  <Button asChild size="sm">
                    <Link href="/customer/delivery/create">Send a parcel</Link>
                  </Button>
                }
              />
            </Card>
          ) : (
            <ul className="space-y-3">
              {recentOrders.slice(0, 4).map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-payments">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 id="recent-payments" className="text-base font-semibold text-ink">
              Recent payments
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/payments">
                View all
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <Card padding="lg">
            {recentPayments.length === 0 ? (
              <EmptyState
                compact
                title="No payments yet"
                description="Payments appear here once you book a delivery."
              />
            ) : (
              <ul className="divide-y divide-line">
                {recentPayments.slice(0, 5).map((payment) => (
                  <li key={payment.id} className="py-2.5 first:pt-0 last:pb-0">
                    <PaymentRow payment={payment} />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-ink-muted">
              <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
              All amounts are simulated demo figures.
            </p>
          </Card>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Active delivery panel                           */
/* -------------------------------------------------------------------------- */

function ActiveDeliveryPanel({ delivery }: { delivery: NonNullable<CustomerDashboard["activeDelivery"]> }) {
  const { data: tracking } = useTracking(delivery.id);
  const location = tracking?.currentLocation ?? null;
  const pickup = delivery.pickupAddress;
  const destination = delivery.deliveryAddress;

  return (
    <Card padding="lg" elevation="elevated" className="overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Truck className="size-3.5" aria-hidden="true" />
            Delivery in progress
          </p>
          <p className="mt-1 font-mono text-base font-bold text-ink">
            {delivery.trackingCode || delivery.id}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={delivery.status} />
            <EtaBadge
              minutes={delivery.etaMinutes ?? null}
              isDelayed={delivery.isDelayed}
            />
            {typeof delivery.distanceKm === "number" ? (
              <span className="text-xs text-ink-muted">
                {formatDistance(delivery.distanceKm)} total
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LiveConnectionChip connected={Boolean(tracking)} />
          <Button asChild size="sm">
            <Link href={`/customer/orders/${delivery.id}/tracking`}>
              Track live
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {location && pickup && destination ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-line">
          <TrackingMap
            pickup={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            destination={{ latitude: destination.latitude, longitude: destination.longitude }}
            courier={location}
            status={delivery.status}
            etaMinutes={delivery.etaMinutes ?? null}
            height="sm"
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          {delivery.courier
            ? `${delivery.courier.firstName} ${delivery.courier.lastName} is handling this delivery`
            : "Finding you a courier…"}
        </p>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/customer/orders/${delivery.id}`}>Order details</Link>
        </Button>
      </div>
    </Card>
  );
}

function CustomerDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading your dashboard…</p>
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

