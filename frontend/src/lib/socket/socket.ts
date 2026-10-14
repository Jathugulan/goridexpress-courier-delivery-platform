"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_PATH, SOCKET_URL } from "@/config";
import type { Courier, NotificationType, OrderStatus, TrackingLocation } from "@/types";

/* -------------------------------------------------------------------------- */
/*                              Event payload types                           */
/* -------------------------------------------------------------------------- */

export interface CourierLocationUpdatedPayload {
  deliveryId: string;
  orderRef: string;
  courierId: string;
  courierName?: string;
  location: { latitude: number; longitude: number };
  accuracy?: number;
  speed?: number;
  heading?: number;
  progressPercent?: number;
  timestamp: string;
}

export interface DeliveryStatusUpdatedPayload {
  deliveryId: string;
  orderRef: string;
  status: OrderStatus;
  label: string;
  note?: string;
  progressPercent?: number;
  occurredAt: string;
}

export interface DeliveryEtaUpdatedPayload {
  deliveryId: string;
  orderRef: string;
  etaMinutes: number;
  distanceKm?: number;
  progressPercent?: number;
  isDelayed?: boolean;
}

export interface CourierAssignedPayload {
  deliveryId: string;
  orderRef: string;
  courier: Pick<Courier, "id" | "firstName" | "lastName" | "phone" | "rating" | "photoUrl">;
  vehicle?: { id: string; type: string; registrationNumber: string; model: string } | null;
  etaMinutes?: number;
}

export interface NotificationCreatedPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  actionUrl?: string | null;
  createdAt: string;
}

export interface DeliveryCompletedPayload {
  deliveryId: string;
  orderRef: string;
  completedAt: string;
  proofOfDelivery?: { receiverName: string; note?: string } | null;
}

/* -------------------------------------------------------------------------- */
/*                              Event name map                                */
/* -------------------------------------------------------------------------- */

export const SOCKET_EVENTS = {
  courierLocationUpdated: "courier.location.updated",
  deliveryStatusUpdated: "delivery.status.updated",
  deliveryEtaUpdated: "delivery.eta.updated",
  courierAssigned: "courier.assigned",
  deliveryPickedUp: "delivery.picked_up",
  deliveryCompleted: "delivery.completed",
  notificationCreated: "notification.created",
  operationsUpdated: "admin.operations.updated",
  connect: "connect",
  disconnect: "disconnect",
  connectError: "connect_error",
} as const;

export const DELIVERY_ROOM_PREFIX = "delivery:";
export const USER_ROOM_PREFIX = "user:";
export const ADMIN_ROOM = "admin:operations";

/* -------------------------------------------------------------------------- */
/*                          Singleton connection manager                      */
/* -------------------------------------------------------------------------- */

let socket: Socket | null = null;
let refCount = 0;

export function deliveryRoom(deliveryId: string) {
  return `${DELIVERY_ROOM_PREFIX}${deliveryId}`;
}

export function userRoom(userId: string) {
  return `${USER_ROOM_PREFIX}${userId}`;
}

/**
 * Lazily create (or reuse) the shared Socket.IO connection.
 * A single connection is shared across the app — reference counted so we
 * never create duplicate sockets or leak listeners.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 6000,
      timeout: 12_000,
    });
  }
  return socket;
}

export function acquireSocket(): Socket {
  refCount += 1;
  return getSocket();
}

export function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    disconnectSocket();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  refCount = 0;
}

export function isSocketConnected() {
  return Boolean(socket?.connected);
}

export function socketState() {
  if (!socket) return { connected: false, id: undefined };
  return { connected: socket.connected, id: socket.id };
}

/* -------------------------------------------------------------------------- */
/*                                  Rooms                                     */
/* -------------------------------------------------------------------------- */

export function joinDeliveryRoom(deliveryId: string): Socket {
  const s = acquireSocket();
  s.emit("tracking:join", { deliveryId });
  return s;
}

export function leaveDeliveryRoom(deliveryId: string): Socket {
  const s = getSocket();
  if (s) s.emit("tracking:leave", { deliveryId });
  return s;
}

export function joinUserRoom(userId: string): Socket {
  const s = acquireSocket();
  s.emit("notifications:join", { userId });
  return s;
}

export function joinAdminRoom(): Socket {
  const s = acquireSocket();
  s.emit("admin:join");
  return s;
}

export function leaveRoom(room: string): Socket {
  const s = getSocket();
  if (s) s.emit("room:leave", { room });
  return s;
}

/**
 * Subscribe to a set of events, returning an unsubscribe function.
 * Callers pass a typed event map, e.g.
 *   subscribe<{ "delivery.status.updated": DeliveryStatusUpdatedPayload }>({ ... })
 */
export function subscribe<E extends object>(
  events: { [K in keyof E]: (payload: E[K]) => void },
): () => void {
  const s = acquireSocket();
  const entries = Object.entries(events) as [string, (payload: never) => void][];
  entries.forEach(([event, handler]) =>
    s.on(event as never, handler as (...args: unknown[]) => void),
  );
  return () => {
    entries.forEach(([event, handler]) =>
      s.off(event as never, handler as (...args: unknown[]) => void),
    );
    releaseSocket();
  };
}

export type { TrackingLocation };
