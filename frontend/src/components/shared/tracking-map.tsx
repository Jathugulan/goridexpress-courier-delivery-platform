"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAP_SIZE } from "@/constants/design";
import type { Coordinates, OrderStatus, RoutePoint, VehicleType } from "@/types";
import type {
  LiveOperationsMapProps,
  TrackingMapInnerProps,
} from "./tracking-map-inner";

/* -------------------------------------------------------------------------- */
/*                      Client-only Leaflet wrappers                         */
/* -------------------------------------------------------------------------- */

const TrackingMapLazy = dynamic<TrackingMapInnerProps>(() => import("./tracking-map-inner"), {
  ssr: false,
  loading: () => <MapLoadingState />,
});

const LiveOperationsMapLazy = dynamic<LiveOperationsMapProps>(
  () => import("./tracking-map-inner").then((mod) => ({ default: mod.LiveOperationsMapInner })),
  { ssr: false, loading: () => <MapLoadingState /> },
);

/* -------------------------------------------------------------------------- */
/*                              Loading / fallback                           */
/* -------------------------------------------------------------------------- */

function MapLoadingState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted",
        className,
      )}
      style={{ minHeight: 260 }}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
      <p className="text-xs font-medium text-ink-muted">Loading map…</p>
    </div>
  );
}

function MapUnavailable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-muted/60 px-6 text-center",
        className,
      )}
      style={{ minHeight: 260 }}
      role="status"
    >
      <MapPin className="size-6 text-ink-disabled" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink">Map unavailable</p>
      <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
        Live map tiles could not be loaded. Delivery status above is still accurate.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Public exports                                */
/* -------------------------------------------------------------------------- */

export function TrackingMap({
  className,
  height = "md",
  ...props
}: TrackingMapInnerProps & { height?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-2xl border border-line shadow-card", className)}
    >
      <React.Suspense fallback={<MapLoadingState />}>
        <TrackingMapLazy {...props} className={cn("rounded-none", MAP_SIZE[height])} />
      </React.Suspense>
    </div>
  );
}

export function LiveOperationsMap({
  className,
  height = "lg",
  ...props
}: LiveOperationsMapProps & { height?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-2xl border border-line shadow-card", className)}
    >
      <React.Suspense fallback={<MapLoadingState />}>
        <LiveOperationsMapLazy {...props} className={cn("rounded-none", MAP_SIZE[height])} />
      </React.Suspense>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Static address mini-map                          */
/* -------------------------------------------------------------------------- */

export function AddressMiniMap({
  latitude,
  longitude,
  label,
  zoom = 13,
  className,
}: {
  latitude: number;
  longitude: number;
  label: string;
  zoom?: number;
  className?: string;
}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return <MapUnavailable className={className} />;
  }
  return (
    <TrackingMap
      pickup={{ latitude, longitude }}
      courier={{ latitude, longitude }}
      follow={false}
      zoom={zoom}
      interactive={false}
      height="sm"
      className={cn("border-none shadow-none", className)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                               Connection chip                             */
/* -------------------------------------------------------------------------- */

export function LiveConnectionChip({
  connected,
  lastUpdatedAt,
  className,
}: {
  connected: boolean;
  lastUpdatedAt?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        connected
          ? "border-success/30 bg-success-light text-success"
          : "border-line bg-muted text-ink-muted",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        {connected ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" />
        ) : null}
        <span className={cn("relative inline-flex size-1.5 rounded-full", connected ? "bg-success" : "bg-ink-disabled")} />
      </span>
      {connected ? "Live" : "Reconnecting…"}
      {lastUpdatedAt ? (
        <span className="font-normal opacity-80">
          · <Navigation className="inline size-3" aria-hidden="true" />
        </span>
      ) : null}
    </span>
  );
}

export type { Coordinates, OrderStatus, RoutePoint, VehicleType };
