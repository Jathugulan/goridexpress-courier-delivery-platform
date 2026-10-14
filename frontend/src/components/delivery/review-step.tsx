"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  CircleAlert,
  MapPin,
  Package2,
  Pencil,
  Ruler,
  TicketPercent,
  Weight,
} from "lucide-react";
import { useDeliveryWizardStore } from "@/store/delivery-store";
import { useCreateDelivery, useCoupons } from "@/hooks/queries";
import { SERVICE_RATES, buildQuoteLocally, packageBadges } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { qk } from "@/hooks/query-keys";
import type { CreateDeliveryPayload } from "@/lib/api/deliveries";
import type { Delivery, Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field, FieldError, FieldLabel } from "@/components/ui/input";
import { Alert } from "@/components/ui/states";
import { PriceSummary, DemoNotice } from "@/components/shared/pricing";

export function ReviewStep() {
  const qc = useQueryClient();
  const draft = useDeliveryWizardStore((s) => s.draft);
  const setStep = useDeliveryWizardStore((s) => s.setStep);
  const setCoupon = useDeliveryWizardStore((s) => s.setCoupon);
  const setOrder = useDeliveryWizardStore((s) => s.setOrder);
  const setIdempotencyKey = useDeliveryWizardStore((s) => s.setIdempotencyKey);
  const createDelivery = useCreateDelivery();
  const { data: coupons, isPending: couponsPending } = useCoupons();
  const [couponInput, setCouponInput] = React.useState(draft.couponCode ?? "");
  const [couponError, setCouponError] = React.useState<string | null>(null);

  const quote = React.useMemo(
    () =>
      buildQuoteLocally({
        pickup: draft.pickup
          ? { latitude: draft.pickup.latitude, longitude: draft.pickup.longitude }
          : null,
        destination: draft.destination
          ? { latitude: draft.destination.latitude, longitude: draft.destination.longitude }
          : null,
        package: draft.package,
        serviceType: draft.serviceType,
        couponDiscount: draft.discount,
        scheduledFor: draft.scheduledFor,
      }),
    [draft],
  );

  const service = SERVICE_RATES.find((s) => s.code === draft.serviceType) ?? SERVICE_RATES[0];
  const badges = packageBadges(draft.package);

  const submit = () => {
    if (!draft.pickup?.id || !draft.destination?.id) {
      toast.error("Select both addresses first.");
      setStep(1);
      return;
    }

    const payload: CreateDeliveryPayload = {
      pickupAddressId: draft.pickup.id,
      deliveryAddressId: draft.destination.id,
      package: draft.package,
      serviceType: draft.serviceType,
      ...(draft.scheduledFor ? { scheduledFor: draft.scheduledFor } : {}),
      ...(draft.courierInstructions ? { courierInstructions: draft.courierInstructions } : {}),
      ...(draft.couponCode ? { couponCode: draft.couponCode } : {}),
    };

    createDelivery.mutate(payload, {
      onSuccess: (created: Delivery) => {
        const orderRef =
          (created as Delivery & { order?: Order }).order?.orderId ?? created.trackingCode ?? created.id;
        setOrder({ deliveryId: created.id, orderRef });
        setIdempotencyKey(crypto.randomUUID());
        void qc.invalidateQueries({ queryKey: qk.orders.all });
        setStep(5);
      },
    });
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCoupon(null, 0);
      setCouponError(null);
      return;
    }
    const match = coupons?.find(
      (c) => c.code.toUpperCase() === code && (c.isActive ?? true),
    );
    if (!match) {
      setCouponError("This coupon code is not valid.");
      return;
    }
    const discount = match.discountType === "PERCENTAGE"
      ? (quote.total * match.discountValue) / 100
      : match.discountValue;
    setCoupon(match.code, Math.min(discount, quote.total));
    setCouponError(null);
    toast.success(`${match.code} applied`, {
      description: `${formatCurrency(Math.min(discount, quote.total))} off this delivery.`,
    });
  };

  return (
    <div className="space-y-5">
      <ReviewBlock title="Pickup" step={1} onEdit={() => setStep(1)}>
        {draft.pickup ? (
          <AddressSummary
            label={draft.pickup.label}
            line={draft.pickup.addressLine}
            city={`${draft.pickup.city}${draft.pickup.postalCode ? ` · ${draft.pickup.postalCode}` : ""}`}
            meta={draft.pickup.recipientName}
            instructions={draft.pickup.deliveryInstructions}
          />
        ) : (
          <span className="text-sm text-ink-muted">Not selected</span>
        )}
      </ReviewBlock>

      <ReviewBlock title="Dropoff" step={1} onEdit={() => setStep(1)}>
        {draft.destination ? (
          <AddressSummary
            label={draft.destination.label}
            line={draft.destination.addressLine}
            city={`${draft.destination.city}${draft.destination.postalCode ? ` · ${draft.destination.postalCode}` : ""}`}
            meta={draft.destination.recipientName}
            instructions={draft.destination.deliveryInstructions}
          />
        ) : (
          <span className="text-sm text-ink-muted">Not selected</span>
        )}
      </ReviewBlock>

      <ReviewBlock title="Package" step={2} onEdit={() => setStep(2)}>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <ReviewDatum icon={<Package2 />} label="Type" value={draft.package.type.replace(/_/g, " ")} />
          <ReviewDatum
            icon={<Weight />}
            label="Weight"
            value={`${draft.package.weight} kg × ${draft.package.quantity}`}
          />
          <ReviewDatum
            icon={<Ruler />}
            label="Dimensions"
            value={`${draft.package.length} × ${draft.package.width} × ${draft.package.height} cm`}
          />
          <ReviewDatum
            icon={<Package2 />}
            label="Chargeable"
            value={`${(draft.package.weight * draft.package.quantity).toFixed(1)} kg`}
          />
        </dl>
        {draft.package.description ? (
          <p className="mt-2 text-sm text-ink-secondary">{draft.package.description}</p>
        ) : null}
        {badges.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className="rounded-full bg-warning-light px-2.5 py-0.5 text-[11px] font-semibold text-warning dark:bg-warning/15"
              >
                {badge.label}
              </span>
            ))}
          </div>
        ) : null}
      </ReviewBlock>

      <ReviewBlock title="Service" step={3} onEdit={() => setStep(3)}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{service.name}</p>
          {draft.scheduledFor ? (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {new Date(draft.scheduledFor).toLocaleString()}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-ink-secondary">{service.description}</p>
        {draft.courierInstructions ? (
          <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-ink-secondary">
            Courier note: {draft.courierInstructions}
          </p>
        ) : null}
      </ReviewBlock>

      <Card padding="md">
        <div className="flex items-center gap-2">
          <TicketPercent className="size-4 text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">Have a coupon?</p>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field className="flex-1">
            <FieldLabel htmlFor="coupon-code" className="sr-only">
              Coupon code
            </FieldLabel>
            <Input
              id="coupon-code"
              value={couponInput}
              onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
              placeholder="GRX10"
              invalid={Boolean(couponError)}
              autoComplete="off"
            />
            {couponError ? <FieldError>{couponError}</FieldError> : null}
          </Field>
          <Button type="button" variant="secondary" onClick={applyCoupon} loading={couponsPending}>
            Apply
          </Button>
        </div>
        {draft.couponCode ? (
          <p className="mt-2 text-xs font-medium text-success">
            {draft.couponCode} applied — you save {formatCurrency(draft.discount)}.
          </p>
        ) : null}
      </Card>

      {createDelivery.isError ? (
        <Alert tone="error" title="Could not create the delivery" icon={CircleAlert}>
          Check your connection to the demo API and try again.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PriceSummary price={quote} isEstimate footer={<DemoNotice className="mt-3" />} />
        <Card padding="md" className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Ready to book?</p>
            <p className="mt-1 text-xs text-ink-muted">
              A courier is assigned after payment. You can cancel free of charge before pickup.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full"
            loading={createDelivery.isPending}
            onClick={submit}
          >
            Continue to payment
          </Button>
        </Card>
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: 1 | 2 | 3;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card padding="md">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
      </div>
      {children}
    </Card>
  );
}

function AddressSummary({
  label,
  line,
  city,
  meta,
  instructions,
}: {
  label: string;
  line: string;
  city: string;
  meta?: string;
  instructions?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-sm text-ink-secondary">{line}</p>
        <p className="text-xs text-ink-muted">{city}</p>
        {meta ? <p className="mt-0.5 text-xs text-ink-muted">Attn: {meta}</p> : null}
        {instructions ? (
          <p className="mt-1 text-xs italic text-ink-muted">“{instructions}”</p>
        ) : null}
      </div>
    </div>
  );
}

function ReviewDatum({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-muted" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</dt>
        <dd className="text-sm font-medium text-ink capitalize">{value}</dd>
      </div>
    </div>
  );
}
