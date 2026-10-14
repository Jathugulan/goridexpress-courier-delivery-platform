"use client";

import * as React from "react";
import { Copy, RefreshCw, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { useCoupons, useProfile } from "@/hooks/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoTag } from "@/components/shared/status";


export function CouponsPanel() {
  const { data: coupons, isPending, isError, error, refetch, isFetching } = useCoupons();
  const { data: profile } = useProfile();

  const copy = (code: string) => {
    void navigator.clipboard
      ?.writeText(code)
      .then(() => toast.success(`${code} copied`, { description: "Paste it at checkout." }))
      .catch(() => toast.error("Could not copy the code"));
  };

  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card padding="lg">
        <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => void refetch()} />
      </Card>
    );
  }

  const items = coupons ?? [];

  if (items.length === 0) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={TicketPercent}
          title="No coupons available"
          description="Promo codes you are eligible for will appear here. Watch the help centre for new offers."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {items.length} code{items.length === 1 ? "" : "s"} available
          {profile?.email ? ` for ${profile.email}` : ""}
        </p>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((coupon) => {
          const expired = new Date(coupon.endDate) < new Date();
          const label =
            coupon.discountType === "PERCENTAGE"
              ? `${coupon.discountValue}% off`
              : `${formatCurrency(coupon.discountValue)} off`;

          return (
            <Card
              key={coupon.id}
              padding="none"
              className="relative overflow-hidden"
            >
              <div
                className="flex items-center justify-between gap-2 border-b border-dashed border-line bg-primary-light/40 px-4 py-3 dark:bg-primary/10"
              >
                <div>
                  <p className="font-mono text-lg font-bold text-primary">{label}</p>
                  <p className="text-[11px] text-ink-muted">{coupon.description ?? "Promo code"}</p>
                </div>
                <DemoTag />
              </div>

              <CardContent className="space-y-2.5 p-4">
                <div className="flex items-center gap-2">
                  <code className="rounded-lg border border-dashed border-primary/50 bg-card px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-ink">
                    {coupon.code}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copy(coupon.code)}
                    aria-label={`Copy coupon ${coupon.code}`}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>

                <dl className="space-y-1 text-[11px] text-ink-muted">
                  <div className="flex justify-between gap-2">
                    <dt>Valid until</dt>
                    <dd className="font-medium text-ink-secondary">{formatDate(coupon.endDate)}</dd>
                  </div>
                  {coupon.minimumOrder > 0 ? (
                    <div className="flex justify-between gap-2">
                      <dt>Min order</dt>
                      <dd className="font-medium text-ink-secondary">
                        {formatCurrency(coupon.minimumOrder)}
                      </dd>
                    </div>
                  ) : null}
                  {coupon.maximumDiscount ? (
                    <div className="flex justify-between gap-2">
                      <dt>Max discount</dt>
                      <dd className="font-medium text-ink-secondary">
                        {formatCurrency(coupon.maximumDiscount)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {expired ? (
                  <p className="text-[11px] font-semibold text-error">Expired</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

