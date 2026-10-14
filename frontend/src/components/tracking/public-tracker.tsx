"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CircleAlert,
  Info,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { usePublicTracking } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/states";
import { CourierIdentity, EtaBadge, OrderStatusBadge, StatusTimeline } from "@/components/shared/status";
import { TrackingMap } from "@/components/shared/tracking-map";
import { formatEta, formatTime, VEHICLE_LABELS } from "@/lib/format";
import type { Address } from "@/types";

const trackSchema = z.object({
  orderRef: z
    .string()
    .trim()
    .min(6, "Order IDs are at least 6 characters")
    .max(32, "That order ID looks too long"),
});

type TrackInput = z.infer<typeof trackSchema>;

function toCoordinates(address?: Partial<Address> | null) {
  if (!address || address.latitude == null || address.longitude == null) return null;
  return { latitude: address.latitude, longitude: address.longitude };
}

export function PublicTracker({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") ?? "";

  const [orderRef, setOrderRef] = React.useState(initialRef);
  const { data, isFetching, error, refetch } = usePublicTracking(orderRef, Boolean(orderRef));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackInput>({
    resolver: zodResolver(trackSchema),
    values: { orderRef: initialRef },
  });

  const onSubmit = (values: TrackInput) => {
    const next = values.orderRef.trim().toUpperCase();
    setOrderRef(next);
    setValue("orderRef", next);
    router.replace(`/track?ref=${encodeURIComponent(next)}`, { scroll: false });
  };

  const snapshot = data?.found ? data : null;
  const notFound = Boolean(data && !data.found);
  const pickup = toCoordinates(snapshot?.pickup);
  const destination = toCoordinates(snapshot?.destination);

  return (
    <div className={cn("space-y-6", className)}>
      <Card padding="lg" elevation="elevated" className="border-primary/20">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="public-track-ref" className="mb-1.5 block text-sm font-medium text-ink">
              Order ID or tracking number
            </label>
            <Input
              id="public-track-ref"
              placeholder="GRX123456"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              icon={<Search />}
              invalid={Boolean(errors.orderRef)}
              {...register("orderRef")}
            />
            {errors.orderRef ? (
              <p className="mt-1.5 text-xs text-error" role="alert">
                {errors.orderRef.message}
              </p>
            ) : null}
          </div>

          <div className="flex gap-2 sm:w-auto">
            <Button
              type="submit"
              loading={isFetching}
              className="flex-1 sm:flex-none"
              rightIcon={<ArrowRight />}
            >
              Track
            </Button>
            {orderRef ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void refetch()}
                aria-label="Refresh tracking"
                disabled={isFetching}
              >
                <RefreshCw className={cn(isFetching && "animate-spin")} />
              </Button>
            ) : null}
          </div>
        </form>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Public tracking shows status, ETA and courier details — no address or contact information.
        </p>
      </Card>

      {notFound ? (
        <Alert
          tone="warning"
          title="We could not find that order"
          description="Check the order ID in your confirmation message. The demo environment only resolves seeded order IDs."
          icon={CircleAlert}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/help">Find a demo order ID</Link>
            </Button>
          }
        />
      ) : null}

      {error && !notFound ? (
        <Alert
          tone="error"
          title="Tracking is unavailable"
          description="The tracking service could not be reached. The demo API is not running, so no live data can be loaded."
          icon={CircleAlert}
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : null}

      {snapshot ? (
        <>
          <Card padding="lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Tracking
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{snapshot.orderRef}</p>
                <div className="mt-2">
                  <OrderStatusBadge status={snapshot.status} />
                </div>
              </div>

              <div className="flex flex-col items-start gap-1.5 sm:items-end">
                <div className="flex items-center gap-2">
                  <EtaBadge minutes={snapshot.eta} isDelayed={snapshot.isDelayed} />
                  <span className="text-sm text-ink-muted">{formatEta(snapshot.eta)}</span>
                </div>
                {snapshot.lastUpdatedAt ? (
                  <p className="text-xs text-ink-muted">
                    Updated {formatTime(snapshot.lastUpdatedAt)}
                  </p>
                ) : null}
              </div>
            </div>

            {snapshot.pickup || snapshot.destination ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <RouteStop icon={Package} label="Pickup" address={snapshot.pickup} />
                <RouteStop icon={MapPin} label="Dropoff" address={snapshot.destination} />
              </div>
            ) : null}

            {snapshot.courier ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/60 p-3.5">
                <CourierIdentity
                  courier={snapshot.courier}
                  showStatus={false}
                  avatarSize="md"
                  className="flex-1"
                  subtitle={
                    snapshot.courier.vehicle
                      ? VEHICLE_LABELS[snapshot.courier.vehicle.type]
                      : "Verified courier"
                  }
                />
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <a href={`tel:${snapshot.courier.phone}`}>
                    <Phone aria-hidden="true" />
                    Call
                  </a>
                </Button>
              </div>
            ) : null}
          </Card>

          {pickup && destination ? (
            <Card padding="lg" className="overflow-hidden p-0">
              <TrackingMap
                pickup={pickup}
                destination={destination}
                courier={snapshot.currentLocation ?? null}
                status={snapshot.status}
                etaMinutes={snapshot.eta}
                distanceKm={snapshot.distanceKm}
                height="md"
                follow
              />
            </Card>
          ) : null}

          {snapshot.status ? <StatusTimeline status={snapshot.status} /> : null}
        </>
      ) : null}

      {!orderRef ? (
        <Card padding="lg" className="text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
            aria-hidden="true"
          >
            <Navigation className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-ink">Enter an order ID to start</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            You can find the ID in your confirmation message, receipt or the order screen after
            signing in. No account needed.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild size="sm">
              <Link href="/login">Sign in to see all orders</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/help">Where do I find my order ID?</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {!snapshot && orderRef && !isFetching && !notFound && !error ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-ink-muted">No tracking data returned for that order ID.</p>
        </Card>
      ) : null}
    </div>
  );
}

function RouteStop({
  icon: Icon,
  label,
  address,
}: {
  icon: typeof Package;
  label: string;
  address?: Partial<Address> | null;
}) {
  if (!address) return null;

  const primary = address.label || address.addressLine || "Address hidden";

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line p-3.5">
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-ink-secondary"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-ink">{primary}</p>
        {address.city ? (
          <p className="truncate text-xs text-ink-muted">
            {address.city}
            {address.postalCode ? ` · ${address.postalCode}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
