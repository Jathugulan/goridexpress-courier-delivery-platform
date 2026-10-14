"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeToastStore, useTrackingStore } from "@/store/delivery-store";
import {
  SOCKET_EVENTS,
  joinAdminRoom,
  joinUserRoom,
  subscribe,
  type CourierAssignedPayload,
  type CourierLocationUpdatedPayload,
  type DeliveryCompletedPayload,
  type DeliveryEtaUpdatedPayload,
  type DeliveryStatusUpdatedPayload,
  type NotificationCreatedPayload,
} from "@/lib/socket/socket";
import { orderMeta } from "@/lib/status";
import { qk } from "@/hooks/query-keys";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ======================================================================== */
/*                          Live toast stack (UI)                          */
/* ======================================================================== */

const TOAST_TONE = {
  info: { className: "border-primary/30 bg-primary-light/95 text-primary-dark dark:text-primary-light" },
  success: { className: "border-success/30 bg-success-light/95 text-success-dark dark:text-success-light" },
  warning: { className: "border-warning/35 bg-warning-light/95 text-warning-dark dark:text-warning-light" },
  error: { className: "border-error/30 bg-error-light/95 text-error-dark dark:text-error-light" },
} as const;

export function LiveToastStack() {
  const toasts = useRealtimeToastStore((s) => s.toasts);
  const dismiss = useRealtimeToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-20 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-80"
      role="region"
      aria-label="Live delivery updates"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-elevated backdrop-blur-sm ${TOAST_TONE[t.type].className}`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-90">{t.message}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Dismiss live update"
            onClick={() => dismiss(t.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X />
          </Button>
        </div>
      ))}
    </div>
  );
}

/* ======================================================================== */
/*                            Realtime bridge                               */
/* ======================================================================== */

interface RealtimeEventMap {
  [SOCKET_EVENTS.deliveryStatusUpdated]: DeliveryStatusUpdatedPayload;
  [SOCKET_EVENTS.deliveryEtaUpdated]: DeliveryEtaUpdatedPayload;
  [SOCKET_EVENTS.courierLocationUpdated]: CourierLocationUpdatedPayload;
  [SOCKET_EVENTS.courierAssigned]: CourierAssignedPayload;
  [SOCKET_EVENTS.deliveryCompleted]: DeliveryCompletedPayload;
  [SOCKET_EVENTS.notificationCreated]: NotificationCreatedPayload;
  [SOCKET_EVENTS.disconnect]: undefined;
  [SOCKET_EVENTS.connect]: undefined;
}

/**
 * Bridges Socket.IO events into:
 *  - Zustand tracking state (live map + progress)
 *  - In-app live toasts
 *  - TanStack Query cache invalidation
 * Only mounted for authenticated users; it joins the user room and, for
 * admins, the operations room.
 */
export function RealtimeBridge() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const pushToast = useRealtimeToastStore((s) => s.push);
  const tracking = useTrackingStore();
  const qc = useQueryClient();

  const isCustomer = role === "CUSTOMER";

  React.useEffect(() => {
    if (!user?.id) return;

    joinUserRoom(user.id);
    if (role === "ADMIN") joinAdminRoom();

    const unsubscribe = subscribe<RealtimeEventMap>({
      [SOCKET_EVENTS.connect]: () => {
        tracking.setConnected(true);
      },

      [SOCKET_EVENTS.disconnect]: () => {
        tracking.setConnected(false);
      },

      [SOCKET_EVENTS.deliveryStatusUpdated]: (payload) => {
        if (!payload) return;
        const meta = orderMeta(payload.status);

        tracking.touch();
        if (typeof payload.progressPercent === "number") {
          tracking.setProgress(payload.progressPercent);
        }
        if (tracking.deliveryId && tracking.deliveryId !== payload.deliveryId) {
          // Not the delivery currently being watched — only refresh data.
        } else {
          tracking.begin(payload.deliveryId);
          if (typeof payload.progressPercent === "number") {
            tracking.setProgress(payload.progressPercent);
          }
        }

        pushToast({
          title: meta.label,
          message: `${payload.orderRef} · ${payload.note ?? meta.description ?? "Status updated"}`,
          type: payload.status === "DELIVERY_FAILED" || payload.status === "CANCELLED" ? "error" : "info",
          href: `/customer/orders/${payload.deliveryId}`,
        });

        void qc.invalidateQueries({ queryKey: qk.tracking.all });
        void qc.invalidateQueries({ queryKey: qk.orders.all });
        void qc.invalidateQueries({ queryKey: qk.deliveries.all });
        void qc.invalidateQueries({ queryKey: qk.dashboard.all });
      },

      [SOCKET_EVENTS.deliveryEtaUpdated]: (payload) => {
        if (!payload) return;
        tracking.setEta(payload.etaMinutes);
        if (typeof payload.progressPercent === "number") tracking.setProgress(payload.progressPercent);
        tracking.touch();
        void qc.invalidateQueries({ queryKey: qk.tracking.all });
      },

      [SOCKET_EVENTS.courierLocationUpdated]: (payload) => {
        if (!payload?.location) return;
        tracking.setCourierLocation(payload.location);
        if (typeof payload.progressPercent === "number") tracking.setProgress(payload.progressPercent);
        tracking.touch();
      },

      [SOCKET_EVENTS.courierAssigned]: (payload) => {
        if (!payload) return;
        pushToast({
          title: "Courier assigned",
          message: `${payload.courier?.firstName ?? "Your courier"} is on the way for ${payload.orderRef}.`,
          type: "success",
          href: `/customer/orders/${payload.deliveryId}/tracking`,
        });
        void qc.invalidateQueries({ queryKey: qk.deliveries.all });
        void qc.invalidateQueries({ queryKey: qk.tracking.all });
      },

      [SOCKET_EVENTS.deliveryCompleted]: (payload) => {
        if (!payload) return;
        tracking.setProgress(100);
        tracking.setEta(0);
        pushToast({
          title: "Delivered",
          message: `${payload.orderRef} was delivered successfully.`,
          type: "success",
          href: `/customer/orders/${payload.deliveryId}`,
        });
        void qc.invalidateQueries({ queryKey: qk.orders.all });
        void qc.invalidateQueries({ queryKey: qk.deliveries.all });
        void qc.invalidateQueries({ queryKey: qk.dashboard.all });
        void qc.invalidateQueries({ queryKey: qk.payments.all });
      },

      [SOCKET_EVENTS.notificationCreated]: (payload) => {
        if (!payload) return;
        pushToast({
          title: payload.title,
          message: payload.message,
          type: payload.type === "PAYMENT_FAILED" || payload.type === "SYSTEM_ALERT" ? "warning" : "info",
          href: payload.actionUrl ?? undefined,
        });
        void qc.invalidateQueries({ queryKey: qk.notifications.all });
        void qc.invalidateQueries({ queryKey: qk.dashboard.customer() });
      },
    });

    if (isCustomer) {
      toast("Live tracking connected", {
        description: "You'll get instant updates as your delivery moves.",
        duration: 3200,
      });
    }

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role, pushToast, qc]);

  return null;
}
