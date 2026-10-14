"use client";

/**
 * Leaflet map renderer.
 * MUST be loaded via `next/dynamic({ ssr: false })` from tracking-map.tsx —
 * Leaflet touches `window` during module evaluation.
 */

import * as React from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { MAP_PROVIDER, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/config";
import { cn } from "@/lib/utils";
import { formatDistance, formatEta, formatTime } from "@/lib/format";
import { orderMeta, vehicleMeta } from "@/lib/status";
import type { Coordinates, OrderStatus, RoutePoint, VehicleType } from "@/types";

/* -------------------------------------------------------------------------- */
/*                              Custom div icons                             */
/* -------------------------------------------------------------------------- */

const pinHtml = (label: string, tone: "primary" | "success" | "error" | "courier") => {
  const colors: Record<string, string> = {
    primary: "#2563EB",
    success: "#16A34A",
    error: "#DC2626",
    courier: "#0EA5E9",
  };
  const color = colors[tone];
  return `
    <span style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:9999px;
      background:${color};color:#fff;font:700 11px/1 system-ui,sans-serif;
      border:3px solid #fff;box-shadow:0 4px 12px rgba(16,35,63,0.35);
    ">${label}</span>
  `;
};

const courierIcon = L.divIcon({
  className: "",
  html: pinHtml("🛵", "courier"),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const pickupIcon = L.divIcon({
  className: "",
  html: pinHtml("A", "success"),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const destinationIcon = L.divIcon({
  className: "",
  html: pinHtml("B", "error"),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

/* -------------------------------------------------------------------------- */
/*                              Viewport helper                              */
/* -------------------------------------------------------------------------- */

function Recenter({
  points,
  zoom,
  enabled,
}: {
  points: Coordinates[];
  zoom?: number;
  enabled: boolean;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (!enabled || points.length === 0) return;
    const valid = points.filter((p) => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude));
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].latitude, valid[0].longitude], zoom ?? 14);
      return;
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: zoom ?? 15 });
  }, [map, points, zoom, enabled]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                  Map body                                 */
/* -------------------------------------------------------------------------- */

export interface TrackingMapInnerProps {
  pickup?: Coordinates | null;
  destination?: Coordinates | null;
  courier?: Coordinates | null;
  route?: RoutePoint[];
  status?: OrderStatus | null;
  vehicleType?: VehicleType | null;
  distanceKm?: number | null;
  etaMinutes?: number | null;
  className?: string;
  /** Fit the viewport whenever the courier moves. */
  follow?: boolean;
  zoom?: number;
  interactive?: boolean;
}

export default function TrackingMapInner({
  pickup,
  destination,
  courier,
  route,
  status,
  vehicleType,
  distanceKm,
  etaMinutes,
  className,
  follow = true,
  zoom,
  interactive = true,
}: TrackingMapInnerProps) {
  const anchor =
    courier ?? destination ?? pickup ?? ({ latitude: 6.9271, longitude: 79.8612 } as Coordinates);

  const focusPoints = React.useMemo<Coordinates[]>(() => {
    const list: Coordinates[] = [];
    if (pickup) list.push(pickup);
    if (destination) list.push(destination);
    if (courier) list.push(courier);
    return list;
  }, [pickup, destination, courier]);

  const routeLine = React.useMemo<[number, number][]>(
    () => (route ?? []).map((p) => [p.latitude, p.longitude] as [number, number]),
    [route],
  );

  const meta = orderMeta(status);
  const vehicle = vehicleMeta(vehicleType);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-2xl", className)}>
      <MapContainer
        center={[anchor.latitude, anchor.longitude]}
        zoom={zoom ?? 13}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl={interactive}
        className="size-full"
        style={{ height: "100%", width: "100%", minHeight: 260 }}
      >
        <TileLayer
          url={MAP_TILE_URL}
          attribution={MAP_PROVIDER === "openstreetmap" ? MAP_TILE_ATTRIBUTION : undefined}
          maxZoom={19}
        />

        {pickup ? (
          <Marker position={[pickup.latitude, pickup.longitude]} icon={pickupIcon}>
            <Popup>
              <strong className="block text-xs">Pickup</strong>
              <span className="text-xs text-slate-600">Package collected from here</span>
            </Popup>
          </Marker>
        ) : null}

        {destination ? (
          <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}>
            <Popup>
              <strong className="block text-xs">Destination</strong>
              <span className="text-xs text-slate-600">
                {distanceKm ? `${formatDistance(distanceKm)} away · ` : ""}
                {formatEta(etaMinutes)}
              </span>
            </Popup>
          </Marker>
        ) : null}

        {routeLine.length > 1 ? (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#2563EB", weight: 4, opacity: 0.65, dashArray: "8 8" }}
          />
        ) : null}

        {courier ? (
          <>
            <Marker position={[courier.latitude, courier.longitude]} icon={courierIcon} zIndexOffset={1000}>
              <Popup>
                <strong className="block text-xs">{meta.label}</strong>
                <span className="text-xs text-slate-600">
                  {vehicle.label}
                  {distanceKm ? ` · ${formatDistance(distanceKm)} remaining` : ""}
                </span>
              </Popup>
            </Marker>
            <Circle
              center={[courier.latitude, courier.longitude]}
              radius={220}
              pathOptions={{ color: "#0EA5E9", fillColor: "#0EA5E9", fillOpacity: 0.08, weight: 1 }}
            />
          </>
        ) : null}

        <Recenter points={follow ? focusPoints : []} zoom={zoom} enabled={follow} />
      </MapContainer>

      {/* Legend — status is never conveyed by colour alone. */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-1.5">
        <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
          A · Pickup
        </span>
        {courier ? (
          <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
            Courier · {formatEta(etaMinutes)}
          </span>
        ) : null}
        <span className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
          B · Destination
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Static multi-point map                          */
/* -------------------------------------------------------------------------- */

export interface LiveOperationsMapProps {
  deliveries: {
    deliveryId: string;
    orderId: string;
    status: OrderStatus;
    courierName: string;
    pickup: Coordinates;
    destination: Coordinates;
    currentLocation: Coordinates | null;
    isDelayed: boolean;
    updatedAt?: string;
  }[];
  className?: string;
  onSelect?: (deliveryId: string) => void;
}

export function LiveOperationsMapInner({ deliveries, className, onSelect }: LiveOperationsMapProps) {
  const points = React.useMemo<Coordinates[]>(
    () =>
      deliveries.flatMap((d) =>
        [d.currentLocation, d.pickup, d.destination].filter(Boolean) as Coordinates[],
      ),
    [deliveries],
  );

  const center = points[0] ?? { latitude: 6.9271, longitude: 79.8612 };

  const markerFor = (delivery: LiveOperationsMapProps["deliveries"][number]) => {
    const meta = orderMeta(delivery.status);
    const label = delivery.isDelayed ? "!" : meta.label.slice(0, 1);
    return L.divIcon({
      className: "",
      html: pinHtml(label, delivery.isDelayed ? "error" : "courier"),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-2xl", className)}>
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={12}
        scrollWheelZoom
        className="size-full"
        style={{ height: "100%", width: "100%", minHeight: 320 }}
      >
        <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} maxZoom={19} />

        {deliveries.map((delivery) => {
          const pos = delivery.currentLocation ?? delivery.pickup;
          const meta = orderMeta(delivery.status);
          return (
            <Marker
              key={delivery.deliveryId}
              position={[pos.latitude, pos.longitude]}
              icon={markerFor(delivery)}
              eventHandlers={{ click: () => onSelect?.(delivery.deliveryId) }}
            >
              <Popup>
                <strong className="block text-xs">{delivery.orderId}</strong>
                <span className="text-xs text-slate-600">{meta.label}</span>
                <span className="mt-0.5 block text-xs text-slate-600">Courier: {delivery.courierName}</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  Updated {formatTime(delivery.updatedAt)}
                </span>
              </Popup>
            </Marker>
          );
        })}

        <Recenter points={points} zoom={12} enabled />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-200">
        {deliveries.length} live {deliveries.length === 1 ? "delivery" : "deliveries"}
      </div>
    </div>
  );
}
