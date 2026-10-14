"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  MapPin,
  MessageSquareWarning,
  Package,
  ReceiptIndianRupee,
  RotateCcw,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useCancelOrder, useOrder, useOrderHistory, useReorder, useWallet } from "@/hooks/queries";
import { formatCurrency, formatDateTime, formatDistance, downloadTextFile } from "@/lib/format";
import { SERVICE_RATES } from "@/lib/pricing";
import { orderMeta } from "@/lib/status";
import type { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Field, FieldLabel } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SectionHeading } from "@/components/shared/filters";
import { ErrorState } from "@/components/ui/states";
import {
  OrderStatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
  StatusTimeline,
  ServiceBadge,
  DemoTag,
} from "@/components/shared/status";
import { ReceiptView } from "@/components/shared/pricing";
import { CourierIdentity } from "@/components/shared/status";

export function OrderDetail({ orderId }: { orderId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: order, isPending, isError, error, refetch } = useOrder(orderId);
  const { data: history } = useOrderHistory(orderId);
  const { data: wallet } = useWallet();
  const cancelOrder = useCancelOrder();
  const reorder = useReorder();

  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  if (isPending) {
    return (
      <div className="space-y-4">
        <Card padding="lg">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
        </Card>
        <Card padding="lg">
          <div className="h-32 w-full animate-pulse rounded bg-muted" />
        </Card>
      </div>
    );
  }
  if (isError || !order) {
    return (
      <Card padding="lg">
        <ErrorState
          description={isError ? undefined : "This order could not be found. It may belong to another account."}
          onRetry={() => void refetch()}
          action={
            <Button asChild>
              <Link href="/customer/orders">Back to orders</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const meta = orderMeta(order.status);
  const canCancel = ["CREATED", "PAYMENT_PENDING", "CONFIRMED", "COURIER_ASSIGNMENT"].includes(
    order.status,
  );
  const canReorder = ["DELIVERED", "CANCELLED", "DELIVERY_FAILED"].includes(order.status);
  const service = SERVICE_RATES.find((s) => s.code === order.serviceType);

  const downloadReceipt = () => {
    const lines = [
      "GoRideXpress — DEMO RECEIPT",
      "================================",
      `Order: ${order.orderId}`,
      `Status: ${meta.label}`,
      `Payment: ${order.paymentStatus} via ${order.paymentMethod}`,
      `Service: ${service?.name ?? order.serviceType}`,
      `Distance: ${order.distanceKm.toFixed(2)} km`,
      `Amount: ${formatCurrency(order.amount)}`,
      order.discount > 0 ? `Discount: -${formatCurrency(order.discount)}` : "",
      `Placed: ${formatDateTime(order.createdAt)}`,
      order.completedAt ? `Completed: ${formatDateTime(order.completedAt)}` : "",
      "",
      "This is a simulated demo receipt. No real payment was processed.",
    ].filter(Boolean);
    downloadTextFile(`goridexpress-${order.orderId}-receipt.txt`, lines.join("\n"));
    toast.success("Demo receipt downloaded");
  };

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
              <ServiceBadge service={order.serviceType} />
            </div>
            <h1 className="mt-2.5 font-mono text-xl font-bold text-ink">{order.orderId}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Placed {formatDateTime(order.createdAt)}
              {order.completedAt ? ` · Completed ${formatDateTime(order.completedAt)}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.status !== "CANCELLED" ? (
              <Button asChild variant="secondary">
                <Link href={`/customer/orders/${order.id}/tracking`}>
                  <MapPin className="size-4" aria-hidden="true" />
                  Live tracking
                </Link>
              </Button>
            ) : null}
            {canCancel ? (
              <Button type="button" variant="outline" onClick={() => setCancelOpen(true)}>
                <Ban className="size-4" aria-hidden="true" />
                Cancel
              </Button>
            ) : null}
            {canReorder ? (
              <Button
                type="button"
                variant="outline"
                loading={reorder.isPending}
                onClick={() => reorder.mutate(order.id)}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reorder
              </Button>
            ) : null}
            <Button type="button" onClick={downloadReceipt}>
              <ReceiptIndianRupee className="size-4" aria-hidden="true" />
              Receipt
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <StatusTimeline status={order.status} history={history} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2 text-sm">
              <Truck className="size-4 text-primary" aria-hidden="true" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <RouteStop
                label="Pickup"
                address={order.pickupAddress?.addressLine}
                city={`${order.pickupAddress?.city ?? ""} ${order.pickupAddress?.postalCode ?? ""}`.trim()}
                contact={order.pickupAddress?.recipientName}
              />
              <RouteStop
                label="Dropoff"
                address={order.deliveryAddress?.addressLine}
                city={`${order.deliveryAddress?.city ?? ""} ${order.deliveryAddress?.postalCode ?? ""}`.trim()}
                contact={order.deliveryAddress?.recipientName}
                last
              />
            </ol>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Package className="size-3.5" aria-hidden="true" />
                {service?.name ?? order.serviceType}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDistance(order.distanceKm)}</span>
              <span aria-hidden="true">·</span>
              <span>ETA {formatDateTime(order.estimatedDelivery)}</span>
            </div>
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2 text-sm">
              <Wallet className="size-4 text-primary" aria-hidden="true" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-muted">Method</span>
              <PaymentMethodBadge method={order.paymentMethod} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-muted">Status</span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            {order.discount > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-ink-muted">Discount</span>
                <span className="text-xs font-semibold text-success">
                  −{formatCurrency(order.discount)}
                  {order.couponCode ? ` (${order.couponCode})` : ""}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
              <span className="text-sm font-semibold text-ink">Total</span>
              <span className="text-lg font-bold text-ink">{formatCurrency(order.amount)}</span>
            </div>
            {wallet ? (
              <p className="text-[11px] text-ink-muted">
                Demo wallet balance {formatCurrency(wallet.balance as number)}
              </p>
            ) : null}
            <DemoTag className="mt-1 inline-flex" />
          </CardContent>
        </Card>
      </div>

      {order.courier ? (
        <Card padding="md">
          <CardHeader>
            <CardTitle as="h2" className="text-sm">
              Assigned courier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CourierIdentity courier={order.courier} showStatus />
          </CardContent>
        </Card>
      ) : null}

      {order.cancelledAt ? (
        <Card padding="md">
          <SectionHeading title="Cancelled" description={formatDateTime(order.cancelledAt)} />
        </Card>
      ) : null}

      <Card padding="md">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-sm">
            <MessageSquareWarning className="size-4 text-primary" aria-hidden="true" />
            Something wrong?
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/customer/support">Contact support</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/help">Read the help centre</Link>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              The courier is notified immediately. Any demo payment is refunded to your wallet.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="cancel-reason">Reason (optional)</FieldLabel>
            <Textarea
              id="cancel-reason"
              rows={3}
              maxLength={200}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Wrong address"
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep order
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={cancelOrder.isPending}
              onClick={() =>
                cancelOrder.mutate(
                  { id: order.id, reason: reason.trim() || "Customer requested cancellation" },
                  { onSuccess: () => setCancelOpen(false) },
                )
              }
            >
              Cancel order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RouteStop({
  label,
  address,
  city,
  contact,
  last,
}: {
  label: string;
  address?: string;
  city?: string;
  contact?: string | null;
  last?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`flex size-7 items-center justify-center rounded-full ${last ? "bg-success text-white" : "bg-primary text-white"}`}
          aria-hidden="true"
        >
          <MapPin className="size-3.5" />
        </span>
        {!last ? <span className="mt-1 w-0.5 flex-1 bg-line" aria-hidden="true" /> : null}
      </div>
      <div className="pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink">{address ?? "—"}</p>
        <p className="text-xs text-ink-muted">{city}</p>
        {contact ? <p className="text-xs text-ink-muted">Attn: {contact}</p> : null}
      </div>
    </li>
  );
}

