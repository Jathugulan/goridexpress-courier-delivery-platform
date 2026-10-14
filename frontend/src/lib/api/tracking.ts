import { api } from "./client";
import type { Courier, TrackingLocation, TrackingSnapshot } from "@/types";

export interface TrackingResponse {
  deliveryId: string;
  orderId: string;
  status: import("@/types").OrderStatus;
  eta: number;
  distanceKm: number;
  progressPercent: number;
  courier: Courier | null;
  vehicle: import("@/types").Vehicle | null;
  pickup: import("@/types").Address;
  destination: import("@/types").Address;
  currentLocation: import("@/types").Coordinates | null;
  route: import("@/types").RoutePoint[];
  locations: TrackingLocation[];
  lastUpdatedAt: string;
  isDelayed: boolean;
}

export const trackingApi = {
  current: (deliveryId: string) => api.get<TrackingSnapshot>(`/tracking/${deliveryId}`),

  history: (deliveryId: string, params?: { limit?: number }) =>
    api.get<TrackingLocation[]>(`/tracking/${deliveryId}/history`, { params }),

  publicTrack: (orderRef: string) =>
    api.get<Partial<TrackingSnapshot> & { orderRef: string; found: boolean }>(
      `/tracking/public/${encodeURIComponent(orderRef)}`,
      { skipErrorToast: true },
    ),
};
