"use client";

import * as React from "react";
import { CalendarClock, Check, Clock, Sparkles, Truck, Zap } from "lucide-react";
import { useDeliveryWizardStore } from "@/store/delivery-store";
import { SERVICE_RATES, buildQuoteLocally } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import type { ServiceType } from "@/types";
import { Card } from "@/components/ui/card";
import { Input, Field, FieldDescription, FieldError, FieldLabel, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const VEHICLE_LABEL: Record<string, string> = {
  BIKE: "Two-wheeler",
  THREE_WHEELER: "Three-wheeler",
  CAR: "Car",
  VAN: "Van",
  WALK: "Foot courier",
};

const SERVICE_ICONS: Record<ServiceType, typeof Zap> = {
  INSTANT: Zap,
  SAME_DAY: Clock,
  REGULAR: Truck,
  SCHEDULED: CalendarClock,
};

function defaultSchedule() {
  const date = new Date();
  date.setHours(date.getHours() + 3, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ServiceStep() {
  const draft = useDeliveryWizardStore((s) => s.draft);
  const setServiceType = useDeliveryWizardStore((s) => s.setServiceType);
  const setScheduledFor = useDeliveryWizardStore((s) => s.setScheduledFor);
  const setCourierInstructions = useDeliveryWizardStore((s) => s.setCourierInstructions);

  const serviceType = draft.serviceType;
  const isScheduled = serviceType === "SCHEDULED";

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
        serviceType,
        couponDiscount: draft.discount,
        scheduledFor: draft.scheduledFor,
      }),
    [draft],
  );

  return (
    <div className="space-y-5">
      <div
        role="radiogroup"
        aria-label="Delivery service"
        className="grid gap-3 md:grid-cols-2"
      >
        {SERVICE_RATES.map((service) => {
          const active = service.code === serviceType;
          const Icon = SERVICE_ICONS[service.code as ServiceType];
          const serviceQuote = buildQuoteLocally({
            pickup: draft.pickup
              ? { latitude: draft.pickup.latitude, longitude: draft.pickup.longitude }
              : null,
            destination: draft.destination
              ? { latitude: draft.destination.latitude, longitude: draft.destination.longitude }
              : null,
            package: draft.package,
            serviceType: service.code as ServiceType,
            couponDiscount: 0,
          });

          return (
            <button
              key={service.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setServiceType(service.code as ServiceType)}
              className={cn(
                "relative flex flex-col rounded-2xl border p-4 text-left transition-all",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                active
                  ? "border-primary bg-primary-light/40 shadow-card dark:bg-primary/10"
                  : "border-line bg-card hover:border-primary/40 hover:shadow-card",
              )}
            >
              {service.popular ? (
                <Badge variant="primary" size="sm" className="absolute right-3 top-3">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Popular
                </Badge>
              ) : null}

              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    active ? "bg-card text-primary shadow-sm" : "bg-muted text-ink-secondary",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{service.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{service.description}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="neutral" size="sm">
                  <Clock className="size-3" aria-hidden="true" />
                  {service.estimatedMinutes < 60
                    ? `${service.estimatedMinutes} min`
                    : service.estimatedMinutes < 1440
                      ? `${Math.round(service.estimatedMinutes / 60)} hours`
                      : "Next day"}
                </Badge>
                <Badge variant="neutral" size="sm">
                  <Truck className="size-3" aria-hidden="true" />
                  {VEHICLE_LABEL[service.vehicleType] ?? service.vehicleType}
                </Badge>
              </div>

              <p className="mt-3 text-lg font-bold text-ink">
                {formatCurrency(serviceQuote.total)}
                <span className="ml-1 text-xs font-normal text-ink-muted">estimated</span>
              </p>

              {active ? (
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Check className="size-3.5" aria-hidden="true" />
                  Selected
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {isScheduled ? (
        <Field required>
          <FieldLabel htmlFor="scheduled-for" required>
            Pickup date &amp; time
          </FieldLabel>
          <Input
            id="scheduled-for"
            type="datetime-local"
            min={defaultSchedule()}
            value={draft.scheduledFor ?? ""}
            onChange={(event) => setScheduledFor(event.target.value || null)}
            invalid={!draft.scheduledFor}
            required
          />
          <FieldDescription>
            Couriers arrive within a 30-minute window around this time.
          </FieldDescription>
          {!draft.scheduledFor ? <FieldError>Choose a pickup time.</FieldError> : null}
        </Field>
      ) : null}

      <Field>
        <FieldLabel htmlFor="courier-instructions">Notes for the courier</FieldLabel>
        <Textarea
          id="courier-instructions"
          rows={3}
          maxLength={300}
          placeholder="e.g. Call on arrival, park in the driveway, hand to the security desk"
          value={draft.courierInstructions}
          onChange={(event) => setCourierInstructions(event.target.value)}
        />
        <FieldDescription>{draft.courierInstructions.length}/300 characters</FieldDescription>
      </Field>

      <Card padding="sm" className="bg-muted/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Estimated total
            </p>
            <p className="text-2xl font-bold text-ink">{formatCurrency(quote.total)}</p>
          </div>
          <div className="text-right text-xs text-ink-muted">
            <p>
              {quote.distanceKm.toFixed(1)} km · {Math.round(quote.durationMinutes)} min
            </p>
            <p>Final price is confirmed before payment.</p>
          </div>
        </div>
      </Card>

      <Alert tone="info" title="Demo pricing">
        Rates are simulated for this demo environment. No real charges are applied.
      </Alert>
    </div>
  );
}
