"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, FileDown, Info, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/display";
import { Alert } from "@/components/ui/states";
import { DemoTag } from "./status";
import { buildReceiptLines, formatCurrency, formatDateTime, type ReceiptRow } from "@/lib/format";
import { DEMO_NOTICE_FULL, DEMO_NOTICE_SHORT, DEMO_RECEIPT_NOTICE } from "@/constants/design";
import type { PriceBreakdown } from "@/types";

/* ======================================================================== */
/*                              Demo disclosure                              */
/* ======================================================================== */

export function DemoNotice({
  variant = "banner",
  className,
  children,
}: {
  variant?: "banner" | "inline" | "card";
  className?: string;
  children?: React.ReactNode;
}) {
  if (variant === "inline") {
    return (
      <p className={cn("flex items-center gap-1.5 text-xs text-ink-muted", className)}>
        <Info className="size-3.5 shrink-0 text-warning" aria-hidden="true" />
        {DEMO_NOTICE_SHORT}
      </p>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-warning/30 bg-warning-light/50 p-4 text-sm text-warning-dark dark:text-warning-light",
          className,
        )}
      >
        <p className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="leading-relaxed">{children ?? DEMO_NOTICE_FULL}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning-light/50 px-3.5 py-2.5",
        className,
      )}
    >
      <ShieldCheck className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-warning-dark dark:text-warning-light">
        {children ?? DEMO_NOTICE_FULL}
      </p>
    </div>
  );
}

/* ======================================================================== */
/*                              Price breakdown                              */
/* ======================================================================== */

export interface PriceLine {
  label: string;
  amount: number;
  tone?: "default" | "discount" | "muted";
  hint?: string;
}

export function PriceRow({
  label,
  amount,
  tone = "default",
  hint,
  currency,
}: PriceLine & { currency?: string }) {
  const isDiscount = tone === "discount" && amount > 0;
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="min-w-0 text-sm text-ink-secondary">
        {label}
        {hint ? <span className="ml-1 text-xs text-ink-muted">({hint})</span> : null}
      </span>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          isDiscount ? "text-success" : tone === "muted" ? "text-ink-muted" : "text-ink",
        )}
      >
        {isDiscount ? `−${formatCurrency(amount, currency)}` : formatCurrency(amount, currency)}
      </span>
    </div>
  );
}

export function PriceTotal({
  label = "Total",
  amount,
  currency,
  emphasis = true,
  className,
}: {
  label?: string;
  amount: number;
  currency?: string;
  emphasis?: boolean;
  className?: string;
}) {
  if (!emphasis) {
    return <PriceRow label={label} amount={amount} currency={currency} />;
  }
  return (
    <div className={cn("flex items-baseline justify-between gap-4 pt-1", className)}>
      <span className="text-base font-semibold text-ink">{label}</span>
      <span className="text-xl font-bold tabular-nums text-primary">
        {formatCurrency(amount, currency)}
      </span>
    </div>
  );
}

/** Full price breakdown used in the booking wizard and order detail. */
export function PriceSummary({
  price,
  isEstimate = false,
  className,
  footer,
}: {
  price: PriceBreakdown;
  isEstimate?: boolean;
  className?: string;
  footer?: React.ReactNode;
}) {
  const lines: PriceLine[] = [
    { label: "Base delivery fee", amount: price.baseFee },
    { label: "Distance fee", amount: price.distanceFee, hint: `${price.distanceKm.toFixed(1)} km` },
  ];
  if (price.handlingFee > 0) lines.push({ label: "Handling fee", amount: price.handlingFee });
  if (price.priorityFee > 0) lines.push({ label: "Priority fee", amount: price.priorityFee });
  if (price.insurance > 0) lines.push({ label: "Insurance", amount: price.insurance });
  if (price.serviceFee > 0) lines.push({ label: "Service fee", amount: price.serviceFee });
  if (price.discount > 0) lines.push({ label: "Discount", amount: price.discount, tone: "discount" });
  if (price.tax > 0) lines.push({ label: "Tax", amount: price.tax, tone: "muted" });

  return (
    <Card className={className} padding="none">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle as="h3" className="flex items-center gap-2">
          Price details
          {isEstimate ? (
            <Badge variant="info" size="sm">
              Estimate
            </Badge>
          ) : null}
        </CardTitle>
        <DemoTag />
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-line">
          {lines.map((line) => (
            <div key={line.label}>
              <dt className="sr-only">{line.label}</dt>
              <dd>
                <PriceRow {...line} currency={price.currency} />
              </dd>
            </div>
          ))}
        </dl>
        <Separator className="my-3" />
        <PriceTotal amount={price.total} currency={price.currency} />
        {isEstimate ? (
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Final price is calculated and confirmed by the GoRideXpress server when the delivery is created.
          </p>
        ) : null}
      </CardContent>
      {footer ? <CardFooter align="end">{footer}</CardFooter> : null}
    </Card>
  );
}

/* ======================================================================== */
/*                                  Receipt                                  */
/* ======================================================================== */

export function ReceiptTable({ rows, className }: { rows: ReceiptRow[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className={cn(
            "flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6",
            row.emphasis && "pt-3.5",
          )}
        >
          <dt className={cn("text-sm", row.emphasis ? "font-semibold text-ink" : "text-ink-muted")}>
            {row.label}
          </dt>
          <dd
            className={cn(
              "break-words text-sm sm:text-right",
              row.emphasis
                ? "text-lg font-bold tabular-nums text-primary"
                : "font-medium tabular-nums text-ink-secondary",
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface ReceiptInput {
  orderRef: string;
  transactionId: string;
  customerName: string;
  customerEmail: string;
  pickupLabel: string;
  deliveryLabel: string;
  serviceLabel: string;
  packageLabel: string;
  distanceKm: number;
  price: PriceBreakdown;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  orderStatusLabel: string;
  orderDate: string;
  estimatedDelivery?: string | null;
  completedAt?: string | null;
}

/** Printable / downloadable demo receipt. */
export function ReceiptView({
  input,
  onDownload,
  className,
}: {
  input: ReceiptInput;
  onDownload?: () => void;
  className?: string;
}) {
  const rows = buildReceiptLines(input);

  return (
    <Card className={className} padding="none">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle as="h3" className="flex items-center gap-2">
          <Receipt className="size-4 text-primary" aria-hidden="true" />
          Demo receipt
        </CardTitle>
        {onDownload ? (
          <Button size="sm" variant="outline" onClick={onDownload} leftIcon={<FileDown />}>
            Download
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <p
          className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-warning/30 bg-warning-light/60 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-warning-dark dark:text-warning-light"
          role="note"
        >
          <BadgeCheck className="size-3.5 shrink-0" aria-hidden="true" />
          {DEMO_RECEIPT_NOTICE}
        </p>
        <ReceiptTable rows={rows} />
      </CardContent>

      <CardFooter className="flex-col items-start gap-1.5 bg-muted/40">
        <p className="text-xs leading-relaxed text-ink-muted">{DEMO_NOTICE_FULL}</p>
        <p className="text-xs text-ink-muted">Generated {formatDateTime(new Date())}</p>
      </CardFooter>
    </Card>
  );
}

/* ======================================================================== */
/*                                Promotional                                */
/* ======================================================================== */

export function PromotionCallout({
  title,
  description,
  code,
  ctaLabel = "Use offer",
  className,
}: {
  title: string;
  description?: string;
  code?: string | null;
  ctaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light via-card to-secondary-light/60 p-5 sm:p-6",
        className,
      )}
    >
      <Sparkles className="absolute -right-4 -top-4 size-24 text-primary/10" aria-hidden="true" />
      <div className="relative">
        <Badge variant="primary" size="sm" className="mb-2">
          Limited offer
        </Badge>
        <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-secondary">{description}</p>
        ) : null}
        {code ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-card px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-primary">
            {code}
          </p>
        ) : null}
        {ctaLabel ? (
          <Button asChild size="sm" className="mt-4">
            <Link href="/login">Sign in to use this offer</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/* ======================================================================== */
/*                              Security reminder                            */
/* ======================================================================== */

export function DemoCardDisclosure({ className }: { className?: string }) {
  return (
    <Alert tone="warning" compact title="Simulated payment — no real money" className={className}>
      <p className="mt-1 leading-relaxed">
        Use any test card number. We never store your CVV or full card number, and no payment is sent to
        any real payment processor.
      </p>
    </Alert>
  );
}
