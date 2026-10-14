"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CircleHelp,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Route as RouteIcon,
} from "lucide-react";
import { useTracking } from "@/hooks/queries";
import { getSocket, isSocketConnected } from "@/lib/socket/socket";
import { useTrackingStore } from "@/store/delivery-store";
import { formatDateTime, formatDistance, formatEta, formatRelative } from "@/lib/format";
import { orderMeta } from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, InlineSpinner } from "@/components/ui/states";
import { StatusTimeline, EtaBadge, CourierIdentity } from "@/components/shared/status";
import { LiveConnectionChip } from "@/components/shared/tracking-map";
import { TrackingMap } from "@/components/shared/tracking-map";
import { cn } from "@/lib/utils";

export function LiveTracking({ deliveryId }: { deliveryId: string }) {
  const { data, isPending, isError, error, refetch, isFetching } = useTracking(deliveryId);
  const liveLocation = useTrackingStore((s) => s.courierLocation);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    setConnected(isSocketConnected());
    const active = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    active.on("connect", onConnect);
    active.on("disconnect", onDisconnect);
    return () => {
      active.off("connect", onConnect);
      active.off("disconnect", onDisconnect);
    };
  }, []);

  if (isPending) {
    return (
      <Card padding="lg">
        <InlineSpinner label="Loading live tracking…" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card padding="lg">
        <ErrorState
          description={error instanceof Error ? error.message : "Tracking is unavailable right now."}
          onRetry={() => void refetch()}
          action={
            <Button asChild variant="outline">
              <Link href={`/customer/orders/${deliveryId}`}>Back to order</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const meta = orderMeta(data.status);
  const currentLocation = liveLocation ?? data.currentLocation;
  const progress = data.progressPercent ?? 0;

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm font-semibold", `text-${meta.tone}`)}>{meta.label}</span>
              <LiveConnectionChip connected={connected} lastUpdatedAt={data.lastUpdatedAt} />
            </div>
            <h1 className="mt-1.5 font-mono text-xl font-bold text-ink">{data.orderId}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Updated {formatRelative(data.lastUpdatedAt)} · {formatDateTime(data.lastUpdatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <EtaBadge minutes={data.eta} isDelayed={data.isDelayed} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh tracking"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/customer/orders/${deliveryId}`}>
                <ArrowLeft className="size-4" aria-hidden="true" />
                Order details
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <StatusTimeline status={data.status} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card padding="none" className="overflow-hidden">
          <div className="relative">
            <TrackingMap
              pickup={{ latitude: data.pickup.latitude, longitude: data.pickup.longitude }}
              destination={{
                latitude: data.destination.latitude,
                longitude: data.destination.longitude,
              }}
              courier={currentLocation}
              route={data.route}
              status={data.status}
              etaMinutes={data.eta}
              height="lg"
            />
            {connected ? null : (
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                <span className="rounded-full bg-ink/85 px-3 py-1 text-[11px] font-medium text-white">
                  Reconnecting to live feed…
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
            <Metric icon={<RouteIcon />} label="Progress" value={`${Math.round(progress)}%`} />
            <Metric icon={<MapPin />} label="Distance" value={formatDistance(data.distanceKm)} />
            <Metric icon={<Clock />} label="ETA" value={formatEta(data.eta)} />
            <Metric
              icon={<CircleHelp />}
              label="Stops"
              value={String(data.locations?.length ?? 0)}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-sm">
                Your courier
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.courier ? (
                <div className="space-y-3">
                  <CourierIdentity courier={data.courier} showStatus avatarSize="lg" />
                  {data.courier.phone ? (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href={`tel:${data.courier.phone}`}>
                        <Phone className="size-3.5" aria-hidden="true" />
                        Call courier
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">
                  Assigning a courier. Tracking activates as soon as they accept the job.
                </p>
              )}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle as="h2" className="text-sm">
                Delivery progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.locations?.length ? (
                <ol className="space-y-3">
                  {data.locations.slice(-6).reverse().map((location, index) => (
                    <li key={location.id ?? index} className="flex gap-2.5">
                      <span
                        className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-ink">
                          {orderMeta(data.status).label} · position ping
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {formatDateTime(location.timestamp)}
                          {location.speed ? ` · ${Math.round(location.speed)} km/h` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-ink-muted">No location updates recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardContent className="flex flex-col gap-2 text-xs text-ink-muted">
              <p>
                Live positions come from the courier device over Socket.IO. If the feed stalls, the map
                falls back to the last known position.
              </p>
              <Link href="/customer/support" className="font-semibold text-primary hover:underline">
                Report a problem
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-muted">
        <span aria-hidden="true">{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
