"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Bike,
  Box,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  MapPin,
  MoreHorizontal,
  Navigation,
  Package,
  Phone,
  Plus,
  Star,
  Tag,
  Ticket as TicketIcon,
  Trash2,
  Truck,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/display";
import {
  DeliveryProgressBar,
  EtaBadge,
  OrderStatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
  OrderStatusLine,
  OrderRefLink,
  PriorityBadge,
  RatingStars,
  ServiceBadge,
  TicketStatusBadge,
  VehicleBadge,
} from "./status";
import { formatCurrency, formatDate, formatDistance, formatEta, formatRelative, toDateTimeAttr } from "@/lib/format";
import { DEMO_NOTICE_SHORT } from "@/constants/design";
import type {
  Address,
  AppNotification,
  Courier,
  CustomerProfile,
  Order,
  Payment,
  PriceBreakdown,
  SupportTicket,
  Vehicle,
  Wallet,
  WalletTransaction,
} from "@/types";

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
};

/* ======================================================================== */
/*                                 Stat card                                 */
/* ======================================================================== */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
  trendLabel,
  href,
  isDemo,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "error" | "purple" | "info";
  trend?: number;
  trendLabel?: string;
  href?: string;
  isDemo?: boolean;
  className?: string;
}) {
  const toneRing: Record<string, string> = {
    primary: "bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    error: "bg-error-light text-error",
    purple: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
    info: "bg-info-light text-info",
  };

  const body = (
    <Card
      interactive={href ? "hover" : "none"}
      padding="md"
      className={cn("h-full", className)}
    >
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneRing[tone])}
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </span>
          {isDemo ? (
            <Badge variant="warning" size="sm" title="Simulated figure — no real money">
              Demo
            </Badge>
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold tabular-nums text-ink">{value}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {trend !== undefined ? (
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  trend > 0 ? "text-success" : trend < 0 ? "text-error" : "text-ink-muted",
                )}
              >
                {trend > 0 ? "▲" : trend < 0 ? "▼" : "■"} {Math.abs(trend).toFixed(1)}%
              </span>
            ) : null}
            {trendLabel || hint ? (
              <span className="text-xs text-ink-muted">{trendLabel ?? hint}</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {body}
      </Link>
    );
  }
  return body;
}

/* ======================================================================== */
/*                                 Order card                                */
/* ======================================================================== */

export function OrderCard({
  order,
  onCancel,
  onReorder,
  cancelling,
  className,
}: {
  order: Order;
  onCancel?: (order: Order) => void;
  onReorder?: (order: Order) => void;
  cancelling?: boolean;
  className?: string;
}) {
  const canCancel = ["CREATED", "PAYMENT_PENDING", "CONFIRMED", "COURIER_ASSIGNMENT"].includes(order.status);
  const canReorder = ["DELIVERED", "CANCELLED", "DELIVERY_FAILED"].includes(order.status);

  return (
    <Card interactive="hover" padding="none" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-3.5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <OrderRefLink orderRef={order.orderId} href={`/customer/orders/${order.id}`} className="text-sm" />
              <span className="text-xs text-ink-muted" suppressHydrationWarning>
                {formatRelative(order.createdAt)}
              </span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {formatDate(order.createdAt)} · {formatDistance(order.distanceKm)} ·{" "}
              {order.serviceType.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <OrderStatusBadge status={order.status} />
            <p className="text-base font-bold tabular-nums text-ink">{formatCurrency(order.amount)}</p>
          </div>
        </div>

        <div className="grid gap-2 rounded-xl bg-muted/50 p-3 text-xs sm:grid-cols-2">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium text-ink-muted">Pickup</p>
              <p className="truncate text-ink">{order.pickupAddress?.addressLine ?? "—"}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-start gap-2">
            <Navigation className="mt-0.5 size-3.5 shrink-0 text-secondary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium text-ink-muted">Deliver to</p>
              <p className="truncate text-ink">{order.deliveryAddress?.addressLine ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PaymentStatusBadge status={order.paymentStatus} />
          <PaymentMethodBadge method={order.paymentMethod} />
          {order.couponCode ? (
            <Badge variant="purple" size="sm" srLabel="Coupon applied">
              <Tag className="size-3" aria-hidden="true" />
              {order.couponCode}
            </Badge>
          ) : null}
          {order.completedAt ? (
            <span className="text-xs text-ink-muted">
              Delivered <time dateTime={toDateTimeAttr(order.completedAt)}>{formatRelative(order.completedAt)}</time>
            </span>
          ) : order.estimatedDelivery ? (
            <EtaBadge minutes={undefined} className="hidden" />
          ) : null}
        </div>
      </CardContent>

      {/* `(onCancel || onReorder || true)` was always true, so the footer was
          unconditional while reading as though it depended on the actions.
          "View details" is always available, so the footer simply always
          renders and the optional actions guard themselves below. */}
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="ml-auto">
          <Link href={`/customer/orders/${order.id}`}>
            View details
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
        {onReorder && canReorder ? (
          <Button size="sm" variant="ghost" onClick={() => onReorder(order)} leftIcon={<ArrowRight />}>
            Reorder
          </Button>
        ) : null}
        {onCancel && canCancel ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCancel(order)}
            loading={cancelling}
            className="text-error hover:bg-error-light"
          >
            Cancel
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

/* ======================================================================== */
/*                          Active delivery card                            */
/* ======================================================================== */

export function ActiveDeliveryCard({
  delivery,
  className,
  compact,
}: {
  delivery: {
    id: string;
    orderId: string;
    status: DeliveryLike["status"];
    progressPercent?: number | null;
    etaMinutes?: number | null;
    isDelayed?: boolean;
    courier?: Courier | null;
    pickupAddress?: Address;
    deliveryAddress?: Address;
    distanceKm?: number;
    price?: PriceBreakdown;
  };
  className?: string;
  compact?: boolean;
}) {
  const pickup = delivery.pickupAddress;
  const destination = delivery.deliveryAddress;

  return (
    <Card interactive="hover" padding="none" className={cn("h-full overflow-hidden", className)}>
      <CardHeader className="flex-row items-center justify-between gap-3 bg-gradient-to-r from-primary to-[#1D4ED8] text-white">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              <Bike className="size-4" aria-hidden="true" />
            </motion.span>
            Delivery in progress
          </p>
          <p className="mt-0.5 truncate text-xs text-white/80">
            {delivery.orderId} · {formatDistance(delivery.distanceKm ?? 0)}
          </p>
        </div>
        <Badge variant="solid" className="border-white/25 bg-white/15 text-white backdrop-blur-sm">
          {formatEta(delivery.etaMinutes)}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <DeliveryProgressBar
          status={delivery.status}
          percent={delivery.progressPercent}
          className="pt-1"
        />

        <ol className="space-y-3" aria-label="Route">
          <li className="flex gap-3">
            <span className="flex flex-col items-center pt-1" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-success ring-4 ring-success/15" />
              <span className="mt-1 w-0.5 flex-1 bg-line" />
            </span>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-medium text-ink-muted">Pickup</p>
              <p className="text-sm text-ink">{pickup?.addressLine ?? "—"}</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex flex-col items-center pt-1" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-error ring-4 ring-error/15" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-muted">Deliver to</p>
              <p className="text-sm text-ink">{destination?.addressLine ?? "—"}</p>
            </div>
          </li>
        </ol>

        {delivery.courier ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-muted">Your courier</p>
              <p className="truncate text-sm font-semibold text-ink">
                {delivery.courier.fullName || `${delivery.courier.firstName} ${delivery.courier.lastName}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RatingStars value={delivery.courier.rating} size="xs" showValue />
              {delivery.courier.phone ? (
                <Tooltip label={`Call ${delivery.courier.firstName}`}>
                  <a
                    href={`tel:${delivery.courier.phone}`}
                    className="flex size-9 items-center justify-center rounded-lg border border-line bg-card text-primary transition-colors hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Call courier ${delivery.courier.firstName}`}
                  >
                    <Phone className="size-4" aria-hidden="true" />
                  </a>
                </Tooltip>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>

      {!compact ? (
        <CardFooter>
          <Button asChild variant="primary" size="sm" className="w-full sm:w-auto">
            <Link href={`/customer/orders/${delivery.id}/tracking`}>
              Track live
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/customer/orders/${delivery.id}`}>Details</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

type DeliveryLike = {
  status: Order["status"];
};

/* ======================================================================== */
/*                                Order row                                 */
/* ======================================================================== */

export function OrderTableRow({ order }: { order: Order }) {
  return (
    <Link
      href={`/customer/orders/${order.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-primary">{order.orderId}</span>
          <OrderStatusBadge status={order.status} />
        </p>
        <p className="mt-1 truncate text-xs text-ink-muted">
          {order.pickupAddress?.addressLine} → {order.deliveryAddress?.addressLine}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-bold tabular-nums text-ink">{formatCurrency(order.amount)}</p>
        <ChevronRight className="size-4 shrink-0 text-ink-disabled" aria-hidden="true" />
      </div>
    </Link>
  );
}

/* ======================================================================== */
/*                               Payment row                                */
/* ======================================================================== */

export function PaymentRow({
  payment,
  onRefund,
  className,
}: {
  payment: Payment;
  onRefund?: (payment: Payment) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
          aria-hidden="true"
        >
          <CreditCard className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink">{payment.transactionId}</span>
            <PaymentStatusBadge status={payment.status} />
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {payment.method === "DUMMY_CARD" && payment.lastFour ? `Demo card •••• ${payment.lastFour}` : null}
            {payment.method === "CASH_ON_DELIVERY" ? "Cash on delivery" : null}
            {payment.method === "DUMMY_WALLET" ? "Demo wallet" : null}
            {payment.method === "DUMMY_MOBILE" ? "Demo mobile pay" : null}
            {" · "}
            <time dateTime={toDateTimeAttr(payment.createdAt)}>{formatDate(payment.createdAt)}</time>
          </p>
          {payment.failureReason ? (
            <p className="mt-0.5 text-xs text-error">{payment.failureReason}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-bold tabular-nums text-ink">
          {formatCurrency(payment.amount, payment.currency)}
        </p>
        {onRefund ? (
          <Button size="xs" variant="outline" onClick={() => onRefund(payment)}>
            Refund
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/* ======================================================================== */
/*                                Address card                              */
/* ======================================================================== */

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  busy,
  className,
}: {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  onSetDefault?: (address: Address) => void;
  busy?: boolean;
  className?: string;
}) {
  return (
    <Card interactive="hover" padding="md" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="truncate text-sm font-semibold text-ink">{address.label}</p>
          </div>
          {address.isDefault ? (
            <Badge variant="primary" size="sm">
              Default
            </Badge>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 text-sm text-ink-secondary">
          {address.recipientName ? (
            <p className="font-medium text-ink">{address.recipientName}</p>
          ) : null}
          <p className="leading-relaxed">{address.addressLine}</p>
          <p className="text-ink-muted">
            {[address.city, address.province].filter(Boolean).join(", ")} {address.postalCode}
          </p>
          {address.contactNumber ? (
            <p className="mt-1 text-xs text-ink-muted">{address.contactNumber}</p>
          ) : null}
          {address.deliveryInstructions ? (
            <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs leading-relaxed text-ink-secondary">
              {address.deliveryInstructions}
            </p>
          ) : null}
        </div>

        {onEdit || onDelete || onSetDefault ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            {onEdit ? (
              <Button size="xs" variant="outline" onClick={() => onEdit(address)}>
                Edit
              </Button>
            ) : null}
            {!address.isDefault && onSetDefault ? (
              <Button size="xs" variant="ghost" onClick={() => onSetDefault(address)} loading={busy}>
                Set default
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onDelete(address)}
                className="ml-auto text-error hover:bg-error-light"
                aria-label={`Delete address ${address.label}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ======================================================================== */
/*                                Coupon card                               */
/* ======================================================================== */

export function CouponCard({
  coupon,
  onApply,
  applying,
  className,
}: {
  coupon: {
    id?: string;
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    maximumDiscount?: number | null;
    minimumOrder: number;
    endDate: string;
    state?: string;
    discountPreview?: number;
  };
  onApply?: (code: string) => void;
  applying?: boolean;
  className?: string;
}) {
  const label =
    coupon.discountType === "PERCENTAGE"
      ? `${coupon.discountValue}% OFF`
      : coupon.discountType === "FIXED_AMOUNT"
        ? `${formatCurrency(coupon.discountValue)} OFF`
        : "FREE DELIVERY";

  const state = coupon.state ?? "AVAILABLE";
  const usable = state === "AVAILABLE";

  return (
    <Card
      padding="none"
      className={cn("relative h-full overflow-hidden", !usable && "opacity-70", className)}
    >
      <div className="flex items-stretch">
        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed border-line-strong bg-primary-light/60 px-2 py-4 text-center dark:bg-primary/10">
          <span className="text-base font-black tracking-tight text-primary">{label}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Demo offer</span>
        </div>

        <CardContent className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-sm font-bold tracking-widest text-ink">{coupon.code}</p>
            {usable ? (
              <Badge variant="success" size="sm">
                Available
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                {state === "USED" ? "Used" : state === "EXPIRED" ? "Expired" : "Unavailable"}
              </Badge>
            )}
          </div>
          {coupon.description ? (
            <p className="text-xs leading-relaxed text-ink-secondary">{coupon.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
            {coupon.minimumOrder > 0 ? (
              <span>Min. order {formatCurrency(coupon.minimumOrder)}</span>
            ) : (
              <span>No minimum</span>
            )}
            {coupon.maximumDiscount ? (
              <span>Max. discount {formatCurrency(coupon.maximumDiscount)}</span>
            ) : null}
            <span>
              Expires <time dateTime={toDateTimeAttr(coupon.endDate)}>{formatDate(coupon.endDate)}</time>
            </span>
          </div>
          {onApply && usable ? (
            <Button size="xs" variant="outline" onClick={() => onApply(coupon.code)} loading={applying}>
              Apply code
            </Button>
          ) : null}
        </CardContent>
      </div>
    </Card>
  );
}

/* ======================================================================== */
/*                                Wallet card                               */
/* ======================================================================== */

export function WalletCard({
  wallet,
  onAddMoney,
  adding,
  className,
}: {
  wallet: Wallet | null | undefined;
  onAddMoney?: (amount: number) => void;
  adding?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#10233F] via-[#15325C] to-[#1D4ED8] p-5 text-white shadow-elevated sm:p-6",
        className,
      )}
    >
      <div className="absolute -right-8 -top-10 size-40 rounded-full bg-white/5" aria-hidden="true" />
      <div className="absolute -bottom-12 -left-6 size-36 rounded-full bg-white/5" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
            <WalletIcon className="size-3.5" aria-hidden="true" />
            Demo wallet
          </p>
          <Badge variant="warning" size="sm" className="bg-white/15 text-white">
            Simulated
          </Badge>
        </div>

        <p className="mt-4 text-3xl font-black tabular-nums sm:text-4xl">
          {formatCurrency(wallet?.balance ?? 0, wallet?.currency)}
        </p>
        <p className="mt-1 text-xs text-white/60">{DEMO_NOTICE_SHORT}</p>

        {onAddMoney ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {[10, 25, 50, 100].map((amount) => (
              <Button
                key={amount}
                size="xs"
                variant="inverse"
                onClick={() => onAddMoney(amount)}
                loading={adding}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                +{formatCurrency(amount)}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ======================================================================== */
/*                             Wallet transaction                           */
/* ======================================================================== */

export function WalletTransactionRow({ transaction }: { transaction: WalletTransaction }) {
  const credit = transaction.amount > 0;
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            credit ? "bg-success-light text-success" : "bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light",
          )}
          aria-hidden="true"
        >
          {credit ? <CircleDollarSign className="size-4" /> : <Banknote className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{transaction.description}</p>
          <p className="text-xs text-ink-muted">
            <time dateTime={toDateTimeAttr(transaction.createdAt)}>{formatDate(transaction.createdAt)}</time>
            {" · "}
            Balance {formatCurrency(transaction.balanceAfter)}
          </p>
        </div>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-bold tabular-nums",
          credit ? "text-success" : "text-ink",
        )}
      >
        {credit ? "+" : "−"}
        {formatCurrency(Math.abs(transaction.amount))}
      </p>
    </div>
  );
}

/* ======================================================================== */
/*                              Notification item                           */
/* ======================================================================== */

export function NotificationItem({
  notification,
  onRead,
  onRemove,
  className,
}: {
  notification: AppNotification;
  onRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}) {
  const unread = !notification.isRead;
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 size-2 shrink-0 rounded-full",
          unread ? "bg-primary" : "bg-transparent",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", unread ? "font-semibold text-ink" : "font-medium text-ink-secondary")}>
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{notification.message}</p>
        <p className="mt-1 text-[11px] text-ink-muted" suppressHydrationWarning>
          <time dateTime={toDateTimeAttr(notification.createdAt)}>{formatRelative(notification.createdAt)}</time>
        </p>
      </div>
      {onRemove ? (
        <IconButton
          label={`Delete notification ${notification.title}`}
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="shrink-0 opacity-60 hover:opacity-100"
        >
          <Trash2 />
        </IconButton>
      ) : null}
    </>
  );

  const shell = cn(
    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
    unread ? "bg-primary-light/40 hover:bg-primary-light/70" : "hover:bg-muted/60",
    className,
  );

  if (notification.actionUrl) {
    return (
      <Link
        href={notification.actionUrl}
        className={cn(shell, "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none")}
        onClick={() => onRead?.(notification.id)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(shell, "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none")}
      onClick={() => onRead?.(notification.id)}
    >
      {content}
    </button>
  );
}

/* ======================================================================== */
/*                               Support ticket                             */
/* ======================================================================== */

export function SupportTicketCard({
  ticket,
  onOpen,
  className,
}: {
  ticket: SupportTicket;
  onOpen?: (ticket: SupportTicket) => void;
  className?: string;
}) {
  return (
    <Card interactive="hover" padding="none" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-2.5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-mono text-xs font-bold text-primary">{ticket.ticketRef}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <p className="text-sm font-semibold leading-snug text-ink">{ticket.subject}</p>
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">{ticket.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
          <Badge variant="outline" size="sm">
            {ticket.category}
          </Badge>
          {ticket.orderRef ? <span className="font-mono">{ticket.orderRef}</span> : null}
          <span suppressHydrationWarning>{formatRelative(ticket.updatedAt)}</span>
        </div>
      </CardContent>
      {onOpen ? (
        <CardFooter align="end">
          <Button size="sm" variant="outline" onClick={() => onOpen(ticket)}>
            Open ticket
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

/* ======================================================================== */
/*                                Courier card                              */
/* ======================================================================== */

export function CourierCard({
  courier,
  actions,
  className,
}: {
  courier: Courier;
  actions?: React.ReactNode;
  className?: string;
}) {
  const name = courier.fullName || `${courier.firstName} ${courier.lastName}`;
  return (
    <Card padding="md" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex items-start gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold uppercase text-primary-dark dark:bg-primary/20 dark:text-primary-light"
            aria-hidden="true"
          >
            {courier.firstName?.[0]}
            {courier.lastName?.[0]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-ink-muted">{courier.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant={
                  courier.status === "ONLINE"
                    ? "success"
                    : courier.status === "BUSY"
                      ? "warning"
                      : courier.status === "SUSPENDED"
                        ? "error"
                        : "neutral"
                }
                size="sm"
              >
                {courier.status.replace(/_/g, " ").toLowerCase()}
              </Badge>
              {courier.vehicle ? <VehicleBadge type={courier.vehicle.type} /> : null}
            </div>
          </div>
          <RatingStars value={courier.rating} size="xs" showValue />
        </div>

        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Deliveries</dt>
            <dd className="text-sm font-bold tabular-nums text-ink">{courier.completedDeliveries}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-muted">On-time</dt>
            <dd className="text-sm font-bold tabular-nums text-ink">{courier.onTimeRate.toFixed(0)}%</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Accept</dt>
            <dd className="text-sm font-bold tabular-nums text-ink">{courier.acceptanceRate.toFixed(0)}%</dd>
          </div>
        </dl>

        {actions ? <div className="flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

/* ======================================================================== */
/*                                Vehicle card                              */
/* ======================================================================== */

export function VehicleCard({
  vehicle,
  courierName,
  actions,
  className,
}: {
  vehicle: Vehicle;
  courierName?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  const statusVariant = vehicle.status === "ACTIVE" ? "success" : vehicle.status === "MAINTENANCE" ? "warning" : "neutral";
  return (
    <Card padding="md" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Truck className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="truncate font-mono text-sm font-bold text-ink">{vehicle.registrationNumber}</p>
          </div>
          <Badge variant={statusVariant} size="sm">
            {vehicle.status.toLowerCase()}
          </Badge>
        </div>
        <div className="text-sm text-ink-secondary">
          <p>
            {vehicle.model}
            {vehicle.color ? ` · ${vehicle.color}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <VehicleBadge type={vehicle.type} />
            {courierName ? <span className="truncate text-xs text-ink-muted">{courierName}</span> : null}
          </div>
        </div>
        {actions ? <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

/* ======================================================================== */
/*                              Customer card                               */
/* ======================================================================== */

export function CustomerCard({
  customer,
  actions,
  className,
}: {
  customer: CustomerProfile;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card padding="md" className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex items-start gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary-light text-sm font-bold uppercase text-secondary-dark dark:text-secondary-light"
            aria-hidden="true"
          >
            {customer.firstName?.[0]}
            {customer.lastName?.[0]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="truncate text-xs text-ink-muted">{customer.email}</p>
          </div>
          <RatingStars value={customer.rating} size="xs" showValue />
        </div>

        <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Orders</dt>
            <dd className="text-sm font-bold tabular-nums text-ink">{customer.totalOrders}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Spent</dt>
            <dd className="text-sm font-bold tabular-nums text-ink">{formatCurrency(customer.totalSpent)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Cancelled</dt>
            <dd className="text-sm font-bold tabular-nums text-ink">{customer.cancelledOrders}</dd>
          </div>
        </dl>

        {actions ? <div className="flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

/* ======================================================================== */
/*                              Quick action                                */
/* ======================================================================== */

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  tone = "primary",
  className,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  tone?: "primary" | "purple" | "success";
  className?: string;
}) {
  const tones = {
    primary: "from-primary to-[#1D4ED8] text-white",
    purple: "from-violet-600 to-violet-800 text-white",
    success: "from-success to-[#15803D] text-white",
  }[tone];

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-card transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:p-5",
        tones,
        className,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm" aria-hidden="true">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-white/80">{description}</span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Add card                                 */
/* -------------------------------------------------------------------------- */

export function AddCard({
  label,
  onClick,
  icon: Icon = Plus,
  className,
}: {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-full min-h-[10rem] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-card/50 p-4 text-ink-muted transition-colors hover:border-primary hover:bg-primary-light/30 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Row action menu                             */
/* -------------------------------------------------------------------------- */

export function RowActions({ label = "More actions", children }: { label?: string; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      <div className="inline-flex items-center gap-1">
        <IconButton label={label} size="icon-sm" variant="ghost">
          <MoreHorizontal />
        </IconButton>
        <span className="sr-only">{children}</span>
      </div>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Misc icons                                */
/* -------------------------------------------------------------------------- */

export const DeliveryIcons = { Package, CalendarClock, TicketIcon, Tag, Star, Truck, Bike, Box };
