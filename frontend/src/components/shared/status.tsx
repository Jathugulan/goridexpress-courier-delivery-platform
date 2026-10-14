"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, CircleDashed, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, ToneBadge, type BadgeProps } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  courierMeta,
  notificationMeta,
  orderMeta,
  paymentMeta,
  paymentMethodMeta,
  priorityMeta,
  serviceMeta,
  ticketMeta,
  vehicleMeta,
  statusProgress,
  type StatusMeta,
  type Tone,
} from "@/lib/status";
import { formatDateTime, formatEta, formatRelative, toDateTimeAttr } from "@/lib/format";
import type {
  Courier,
  CourierStatus,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceType,
  StatusHistoryEntry,
  TicketPriority,
  TicketStatus,
  VehicleType,
} from "@/types";

/* ======================================================================== */
/*                              Generic status pill                         */
/* ======================================================================== */

export function StatusPill({
  meta,
  srPrefix,
  ...props
}: { meta: StatusMeta; srPrefix?: string } & Omit<BadgeProps, "children">) {
  const Icon = meta.icon;
  return (
    <ToneBadge tone={meta.tone} srLabel={srPrefix ?? meta.label} size="sm" {...props}>
      <Icon aria-hidden="true" />
      {meta.label}
    </ToneBadge>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Domain-specific status badges                     */
/* -------------------------------------------------------------------------- */

export function OrderStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status?: OrderStatus | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return <StatusPill meta={orderMeta(status)} size={size} className={className} srPrefix="Order status" />;
}

export function PaymentStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status?: PaymentStatus | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return <StatusPill meta={paymentMeta(status)} size={size} className={className} srPrefix="Payment status" />;
}

export function PaymentMethodBadge({
  method,
  size = "sm",
  className,
}: {
  method?: PaymentMethod | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return (
    <StatusPill
      meta={paymentMethodMeta(method)}
      size={size}
      className={className}
      srPrefix="Payment method"
    />
  );
}

export function CourierStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status?: CourierStatus | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return <StatusPill meta={courierMeta(status)} size={size} className={className} srPrefix="Courier status" />;
}

export function TicketStatusBadge({
  status,
  size = "sm",
  className,
}: {
  status?: TicketStatus | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return <StatusPill meta={ticketMeta(status)} size={size} className={className} srPrefix="Ticket status" />;
}

export function PriorityBadge({
  priority,
  size = "sm",
  className,
}: {
  priority?: TicketPriority | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  return <StatusPill meta={priorityMeta(priority)} size={size} className={className} srPrefix="Priority" />;
}

export function ServiceBadge({
  service,
  size = "sm",
  className,
}: {
  service?: ServiceType | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  const meta = serviceMeta(service);
  return (
    <Badge variant="secondary" size={size} className={className} srLabel="Service">
      <meta.icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function VehicleBadge({
  type,
  size = "sm",
  className,
}: {
  type?: VehicleType | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  const meta = vehicleMeta(type);
  return (
    <Badge variant="outline" size={size} className={className} srLabel="Vehicle">
      <meta.icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function NotificationTypeBadge({
  type,
  size = "sm",
  className,
}: {
  type?: NotificationType | null;
  size?: BadgeProps["size"];
  className?: string;
}) {
  const meta = notificationMeta(type);
  return (
    <ToneBadge tone={meta.tone} size={size} className={className} srLabel="Notification type">
      <meta.icon aria-hidden="true" />
      {meta.label}
    </ToneBadge>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Demo tag                                  */
/* -------------------------------------------------------------------------- */

export function DemoTag({ className, label = "Demo" }: { className?: string; label?: string }) {
  return (
    <Badge
      variant="warning"
      size="sm"
      className={cn("uppercase tracking-wide", className)}
      title="Simulated data — no real money involved"
    >
      {label}
    </Badge>
  );
}

/* ======================================================================== */
/*                               Delivery progress                           */
/* ======================================================================== */

export function DeliveryProgressBar({
  status,
  percent,
  className,
  showValue = true,
}: {
  status?: OrderStatus | null;
  percent?: number | null;
  className?: string;
  showValue?: boolean;
}) {
  const value = percent ?? statusProgress(status ?? "CREATED");
  const meta = orderMeta(status);
  const tone: "primary" | "success" | "warning" | "error" =
    status === "DELIVERED" ? "success" : status === "CANCELLED" || status === "DELIVERY_FAILED" ? "error" : "primary";

  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-medium text-ink-secondary">{meta.label}</span>
        {showValue ? (
          <span className="text-xs font-semibold tabular-nums text-ink">{Math.round(value)}%</span>
        ) : null}
      </div>
      <Progress value={value} tone={tone} label="Delivery progress" animated={status !== "DELIVERED"} />
    </div>
  );
}

/* ======================================================================== */
/*                              Status timeline                              */
/* ======================================================================== */

const TIMELINE_CONNECTOR = "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 bg-line";

/**
 * Vertical delivery timeline.
 * `history` (server status log) is preferred; when absent the timeline is
 * derived from the current status alone so it still renders meaningfully.
 */
export function StatusTimeline({
  status,
  history,
  steps,
  className,
}: {
  status?: OrderStatus | null;
  history?: StatusHistoryEntry[];
  /** Explicit milestone list; defaults to the customer-facing flow. */
  steps?: OrderStatus[];
  className?: string;
}) {
  const list = React.useMemo<StatusHistoryEntry[]>(() => {
    if (history && history.length > 0) {
      return [...history].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return [];
  }, [history]);

  const milestones = steps;
  const current = status ?? list[list.length - 1]?.status ?? "CREATED";

  if (milestones) {
    const currentIndex = milestones.indexOf(current);
    return (
      <ol className={cn("space-y-0", className)}>
        {milestones.map((step, i) => {
          const meta = orderMeta(step);
          const done = currentIndex >= 0 && i < currentIndex;
          const active = i === currentIndex;
          const Icon = done ? Check : active ? meta.icon : CircleDashed;
          const reachedAt = list.find((h) => h.status === step)?.createdAt;

          return (
            <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
              {i < milestones.length - 1 ? (
                <span className={cn(TIMELINE_CONNECTOR, done && "bg-success/40")} aria-hidden="true" />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors [&_svg]:size-4",
                  done && "border-success bg-success text-white",
                  active && "border-primary bg-primary text-white shadow-[0_0_0_4px_rgb(37_99_235/0.12)]",
                  !done && !active && "border-line-strong bg-muted text-ink-disabled",
                )}
                aria-hidden="true"
              >
                <Icon className={cn(!done && !active && "opacity-60")} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    done || active ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {meta.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {meta.description}
                  {reachedAt ? (
                    <>
                      {" · "}
                      <time dateTime={toDateTimeAttr(reachedAt)}>{formatDateTime(reachedAt)}</time>
                    </>
                  ) : null}
                </p>
                {active ? <span className="sr-only">(current step)</span> : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  /* History-driven timeline (admin / order detail). */
  if (list.length === 0) {
    return (
      <p className={cn("text-sm text-ink-muted", className)}>No status history recorded yet.</p>
    );
  }

  return (
    <ol className={cn("space-y-0", className)}>
      {list.map((entry, i) => {
        const meta = orderMeta(entry.status);
        const isLast = i === list.length - 1;
        return (
          <li key={entry._id ?? `${entry.status}-${entry.createdAt}`} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? <span className={TIMELINE_CONNECTOR} aria-hidden="true" /> : null}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-card text-primary",
                isLast ? "border-primary" : "border-line-strong text-ink-muted",
              )}
              aria-hidden="true"
            >
              <meta.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-semibold text-ink">{entry.label || meta.label}</p>
                {isLast ? <Badge variant="primary" size="sm">Current</Badge> : null}
              </div>
              {entry.note ? (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">{entry.note}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-ink-muted">
                <time dateTime={toDateTimeAttr(entry.createdAt)}>{formatDateTime(entry.createdAt)}</time>
                {entry.actorName ? ` · ${entry.actorName}` : ""}
                {entry.actorRole ? ` (${entry.actorRole.toLowerCase()})` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ======================================================================== */
/*                              Compact status line                           */
/* ======================================================================== */

export function OrderStatusLine({
  status,
  updatedAt,
  className,
}: {
  status?: OrderStatus | null;
  updatedAt?: string | null;
  className?: string;
}) {
  const meta = orderMeta(status);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <StatusPill meta={meta} srPrefix="Order status" />
      {updatedAt ? (
        <span className="text-xs text-ink-muted" suppressHydrationWarning>
          updated <time dateTime={toDateTimeAttr(updatedAt)}>{formatRelative(updatedAt)}</time>
        </span>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                                    ETA                                    */
/* ======================================================================== */

export function EtaBadge({
  minutes,
  isDelayed,
  className,
}: {
  minutes?: number | null;
  isDelayed?: boolean;
  className?: string;
}) {
  return (
    <Badge variant={isDelayed ? "warning" : "info"} size="sm" className={className} srLabel="Estimated arrival">
      {isDelayed ? "Delayed · " : "ETA "}
      {formatEta(minutes)}
    </Badge>
  );
}

/* ======================================================================== */
/*                                   Rating                                  */
/* ======================================================================== */

export function RatingStars({
  value = 0,
  count,
  size = "md",
  showValue = false,
  className,
}: {
  value?: number | null;
  count?: number | null;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const rating = Math.max(0, Math.min(5, value ?? 0));
  const dim = { xs: "size-3", sm: "size-3.5", md: "size-4", lg: "size-5" }[size];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              dim,
              i <= Math.round(rating) ? "fill-warning text-warning" : "fill-transparent text-line-strong",
            )}
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-sm font-semibold tabular-nums text-ink">{rating.toFixed(1)}</span>
      ) : null}
      {count !== undefined && count !== null ? (
        <span className="text-xs text-ink-muted">({count})</span>
      ) : null}
      <span className="sr-only">
        {rating.toFixed(1)} out of 5{count ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}

/** Interactive 1–5 star input with keyboard + pointer support. */
export function RatingInput({
  value,
  onChange,
  label = "Rating",
  required,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = React.useState(0);
  const shown = hovered || value;

  return (
    <div className={className} role="radiogroup" aria-label={label} aria-required={required}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(0)}
            onClick={() => onChange(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange(Math.min(5, (value || 1) + 1));
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange(Math.max(1, (value || 1) - 1));
              }
            }}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                i <= shown ? "fill-warning text-warning" : "fill-transparent text-line-strong",
              )}
              aria-hidden="true"
            />
          </button>
        ))}
        {value > 0 ? (
          <span className="ml-1.5 text-sm font-semibold text-ink-secondary">{value}/5</span>
        ) : null}
      </div>
    </div>
  );
}

/* ======================================================================== */
/*                              Courier identity                             */
/* ======================================================================== */

export function CourierIdentity({
  courier,
  subtitle,
  className,
  showStatus = true,
  avatarSize = "sm",
}: {
  courier?: Courier | null;
  subtitle?: React.ReactNode;
  className?: string;
  showStatus?: boolean;
  avatarSize?: "xs" | "sm" | "md" | "lg";
}) {
  if (!courier) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <span
          className="flex size-9 items-center justify-center rounded-full border border-dashed border-line-strong text-ink-disabled"
          aria-hidden="true"
        >
          <CircleDashed className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-muted">Courier not assigned yet</p>
          <p className="text-xs text-ink-muted">We&apos;re matching the nearest available courier.</p>
        </div>
      </div>
    );
  }

  const name = courier.fullName || `${courier.firstName} ${courier.lastName}`.trim();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold uppercase text-primary-dark dark:bg-primary/20 dark:text-primary-light"
        style={{ width: avatarSize === "lg" ? 48 : avatarSize === "md" ? 40 : 36, height: avatarSize === "lg" ? 48 : avatarSize === "md" ? 40 : 36 }}
        aria-hidden="true"
      >
        <span className="text-xs">
          {courier.firstName?.[0] ?? ""}
          {courier.lastName?.[0] ?? ""}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {showStatus ? <CourierStatusBadge status={courier.status} /> : null}
          {courier.isVerified ? (
            <Badge variant="success" size="sm" srLabel="Verified courier">
              Verified
            </Badge>
          ) : null}
        </div>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
      <RatingStars value={courier.rating} size="xs" showValue className="hidden sm:flex" />
    </div>
  );
}

/* ======================================================================== */
/*                           Animated status transition                      */
/* ======================================================================== */

export function StatusChangeFlash({
  status,
  children,
}: {
  status?: OrderStatus | null;
  children: React.ReactNode;
}) {
  const meta = orderMeta(status);
  return (
    <motion.div
      key={meta.label}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                  */
/* -------------------------------------------------------------------------- */

export function statusTone(status?: OrderStatus | null): Tone {
  return orderMeta(status).tone;
}

export function statusIcon(status?: OrderStatus | null): LucideIcon {
  return orderMeta(status).icon;
}

export function OrderRefLink({
  orderRef,
  href,
  className,
}: {
  orderRef: string;
  href?: string;
  className?: string;
}) {
  if (!href) return <span className={cn("font-mono text-xs font-semibold text-ink", className)}>{orderRef}</span>;
  return (
    <Link
      href={href}
      className={cn(
        "rounded font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        className,
      )}
    >
      {orderRef}
    </Link>
  );
}
