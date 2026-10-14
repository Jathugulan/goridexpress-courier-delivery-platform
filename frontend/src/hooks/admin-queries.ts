"use client";

/* ======================================================================== */
/*                              Admin queries                               */
/* ======================================================================== */

import { toast } from "sonner";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  adminAuditApi,
  adminCouponsApi,
  adminCouriersApi,
  adminCustomersApi,
  adminDashboardApi,
  adminDeliveriesApi,
  adminNotificationsApi,
  adminOrdersApi,
  adminPaymentsApi,
  adminPromotionsApi,
  adminSettingsApi,
  adminSupportApi,
  adminVehiclesApi,
  analyticsApi,
  type CourierPayload,
  type PromotionPayload,
  type UpdateOrderPayload,
} from "@/lib/api/admin";
import type { RefundPayload } from "@/lib/api/payments";
import { qk } from "./query-keys";
import { useListQuery, notifyError, type ListParams } from "./queries";
import type { ListQuery } from "@/types";
import type { Courier, CustomerProfile, Order, Payment, Vehicle } from "@/types";

/* -------------------------------- Dashboard ------------------------------- */

export function useAdminDashboard() {
  return useQuery({
    queryKey: qk.admin.dashboard(),
    queryFn: adminDashboardApi.get,
    refetchInterval: 30_000,
  });
}

export function useOperationsSnapshot() {
  return useQuery({
    queryKey: qk.admin.operations(),
    queryFn: adminDeliveriesApi.snapshot,
    refetchInterval: 20_000,
  });
}

export function useLiveDeliveries(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.liveDeliveries(params),
    fetcher: (p) => adminDeliveriesApi.live(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });
}

/* -------------------------------- Analytics ------------------------------- */

export function useAnalyticsOverview(range?: Record<string, string>) {
  return useQuery({
    queryKey: [...qk.admin.all, "analytics", "overview", range ?? {}] as const,
    queryFn: () => analyticsApi.overview(range),
    staleTime: 60_000,
  });
}

export function useAnalyticsFull(range?: Record<string, string>) {
  return useQuery({
    queryKey: [...qk.admin.all, "analytics", "full", range ?? {}] as const,
    queryFn: () => analyticsApi.full(range),
    staleTime: 60_000,
  });
}

export function useAnalyticsSection<T>(
  section: "orders" | "payments" | "deliveries" | "customers" | "couriers" | "heatmap",
  range?: Record<string, string>,
) {
  return useQuery({
    queryKey: [...qk.admin.all, "analytics", section, range ?? {}] as const,
    queryFn: () => analyticsApi[section](range) as Promise<T>,
    staleTime: 60_000,
  });
}

/* -------------------------------- Customers ------------------------------- */

export function useAdminCustomers(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.customers(params),
    fetcher: (p) => adminCustomersApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminCustomer(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.admin.customer(id ?? "none"),
    queryFn: () => adminCustomersApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCustomerOrders(id?: string, params: ListParams = { page: 1, limit: 5 }) {
  return useListQuery({
    queryKey: qk.admin.customerOrders(id ?? "none", params),
    fetcher: (p) => adminCustomersApi.orders(id as string, p as ListQuery),
    params,
    enabled: Boolean(id),
    placeholderData: (prev) => prev,
  });
}

export function useAdminCustomerBlock() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: qk.admin.all });

  const block = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCustomersApi.block(id, reason),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not block this customer."),
  });

  const unblock = useMutation({
    mutationFn: (id: string) => adminCustomersApi.unblock(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not unblock this customer."),
  });

  return { block, unblock };
}

/* ---------------------------------- Orders -------------------------------- */

export function useAdminOrders(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.orders(params),
    fetcher: (p) => adminOrdersApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminOrder(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.admin.order(id ?? "none"),
    queryFn: () => adminOrdersApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminOrderMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.admin.all });
    void qc.invalidateQueries({ queryKey: qk.orders.all });
    void qc.invalidateQueries({ queryKey: qk.deliveries.all });
  };

  const assignCourier = useMutation({
    mutationFn: ({ id, courierId }: { id: string; courierId: string }) =>
      adminOrdersApi.assignCourier(id, courierId),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not assign that courier."),
  });

  const unassignCourier = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminOrdersApi.unassignCourier(id, reason),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not unassign the courier."),
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminOrdersApi.cancel(id, reason),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not cancel this order."),
  });

  const advanceStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: Order["status"]; note?: string }) =>
      adminOrdersApi.advanceStatus(id, status, note),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update the status."),
  });

  const refund = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RefundPayload }) =>
      adminOrdersApi.refund(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not process the refund."),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderPayload }) =>
      adminOrdersApi.update(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update this order."),
  });

  return { assignCourier, unassignCourier, cancel, advanceStatus, refund, update };
}

export function useCourierRecommendations(orderId?: string, enabled = true) {
  return useQuery({
    queryKey: qk.admin.orderRecommendations(orderId ?? "none"),
    queryFn: () => adminOrdersApi.recommendCouriers(orderId as string),
    enabled: enabled && Boolean(orderId),
    staleTime: 30_000,
  });
}

/* --------------------------------- Payments ------------------------------- */

export function useAdminPayments(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.payments(params),
    fetcher: (p) => adminPaymentsApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminPaymentStats() {
  return useQuery({ queryKey: qk.admin.paymentStats(), queryFn: adminPaymentsApi.stats, staleTime: 60_000 });
}

export function useCodPending(params: ListParams) {
  return useListQuery({
    queryKey: [...qk.admin.all, "payments", "cod", params] as const,
    fetcher: (p) => adminPaymentsApi.codPending(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminPaymentMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.admin.all });
    void qc.invalidateQueries({ queryKey: qk.payments.all });
  };

  const refund = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RefundPayload }) =>
      adminPaymentsApi.refund(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not process the refund."),
  });

  const codCollect = useMutation({
    mutationFn: ({ id, collected }: { id: string; collected: boolean }) =>
      adminPaymentsApi.codCollect(id, { collected }),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update the COD record."),
  });

  return { refund, codCollect };
}

/* -------------------------- Couriers / vehicles -------------------------- */

export function useAdminCouriers(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.couriers(params),
    fetcher: (p) => adminCouriersApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminCourier(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.admin.courier(id ?? "none"),
    queryFn: () => adminCouriersApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCourierMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.admin.couriers?.() ?? qk.admin.all });
    void qc.invalidateQueries({ queryKey: qk.admin.all });
  };

  const create = useMutation({
    mutationFn: (payload: CourierPayload) => adminCouriersApi.create(payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not create this courier."),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CourierPayload> }) =>
      adminCouriersApi.update(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update this courier."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminCouriersApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not remove this courier."),
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminCouriersApi.approve(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not approve this courier."),
  });

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminCouriersApi.suspend(id, reason),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not suspend this courier."),
  });

  const activate = useMutation({
    mutationFn: (id: string) => adminCouriersApi.activate(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not reactivate this courier."),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Courier["status"] }) =>
      adminCouriersApi.setStatus(id, status),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not change the courier status."),
  });

  const assignVehicle = useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string | null }) =>
      adminCouriersApi.assignVehicle(id, vehicleId),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not assign the vehicle."),
  });

  return { create, update, remove, approve, suspend, activate, setStatus, assignVehicle };
}

export function useAdminVehicles(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.vehicles(params),
    fetcher: (p) => adminVehiclesApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminVehicleMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: qk.admin.all });

  const create = useMutation({
    mutationFn: (payload: Parameters<typeof adminVehiclesApi.create>[0]) =>
      adminVehiclesApi.create(payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not create this vehicle."),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminVehiclesApi.update>[1] }) =>
      adminVehiclesApi.update(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update this vehicle."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminVehiclesApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not remove this vehicle."),
  });

  return { create, update, remove };
}

/* ---------------------------- Live deliveries ----------------------------- */

export function useAdminDeliveries(params: ListParams) {
  return useListQuery({
    queryKey: [...qk.admin.all, "deliveries", "list", params] as const,
    fetcher: (p) => adminDeliveriesApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminDeliveryMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.admin.all });
    void qc.invalidateQueries({ queryKey: qk.deliveries.all });
  };

  const advanceStatus = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: Order["status"]; note?: string }) =>
      adminDeliveriesApi.advanceStatus(id, status, note),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update the delivery status."),
  });

  const simulate = useMutation({
    mutationFn: (id: string) => adminDeliveriesApi.simulateCourier(id),
    onSuccess: () => {
      invalidate();
      toast.success("Courier simulation started", {
        description: "Watch the live board for position updates.",
      });
    },
    onError: (e) => notifyError(e, "Could not start the simulation."),
  });

  return { advanceStatus, simulate };
}

/* ------------------------ Coupons / promotions ---------------------------- */

export function useAdminCoupons(params: ListParams) {
  return useListQuery({
    queryKey: [...qk.admin.all, "coupons", params] as const,
    fetcher: (p) => adminCouponsApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminCouponMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.admin.all });
    void qc.invalidateQueries({ queryKey: qk.coupons.all });
  };

  const create = useMutation({
    mutationFn: (payload: Parameters<typeof adminCouponsApi.create>[0]) =>
      adminCouponsApi.create(payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not create this coupon."),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminCouponsApi.update>[1] }) =>
      adminCouponsApi.update(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update this coupon."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminCouponsApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not remove this coupon."),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCouponsApi.toggle(id, isActive),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not toggle this coupon."),
  });

  return { create, update, remove, toggle };
}

export function useAdminPromotions(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.promotions(params),
    fetcher: (p) => adminPromotionsApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminPromotionMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: qk.admin.all });

  const create = useMutation({
    mutationFn: (payload: PromotionPayload) => adminPromotionsApi.create(payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not create this promotion."),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PromotionPayload> }) =>
      adminPromotionsApi.update(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update this promotion."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminPromotionsApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not remove this promotion."),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPromotionsApi.toggle(id, isActive),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not toggle this promotion."),
  });

  return { create, update, remove, toggle };
}

/* --------------------------------- Support -------------------------------- */

export function useAdminTickets(params: ListParams) {
  return useListQuery({
    queryKey: qk.admin.tickets(params),
    fetcher: (p) => adminSupportApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminTicket(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.admin.ticket(id ?? "none"),
    queryFn: () => adminSupportApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminTicketMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.admin.all });
    void qc.invalidateQueries({ queryKey: qk.support.all });
  };

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof adminSupportApi.update>[1];
    }) => adminSupportApi.update(id, payload),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not update this ticket."),
  });

  const reply = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => adminSupportApi.reply(id, body),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not send the reply."),
  });

  const close = useMutation({
    mutationFn: (id: string) => adminSupportApi.close(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not close this ticket."),
  });

  return { update, reply, close };
}

/* ------------------------- Settings / audit / alerts ---------------------- */

export function useAdminSettings() {
  return useQuery({ queryKey: [...qk.admin.all, "settings"] as const, queryFn: adminSettingsApi.get });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof adminSettingsApi.update>[0]) =>
      adminSettingsApi.update(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.admin.all }),
    onError: (e) => notifyError(e, "Could not save settings."),
  });
}

export function useAuditLogs(params: ListParams) {
  return useListQuery({
    queryKey: [...qk.admin.all, "audit", params] as const,
    fetcher: (p) => adminAuditApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminNotifications(params: ListParams) {
  return useListQuery({
    queryKey: [...qk.admin.all, "notifications", params] as const,
    fetcher: (p) => adminNotificationsApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAdminNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: qk.admin.all });

  const markRead = useMutation({
    mutationFn: (id: string) => adminNotificationsApi.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => adminNotificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead };
}

export type { Order, Payment, Courier, Vehicle, CustomerProfile };
export type { ListQuery as AdminListQuery, UseQueryOptions as AdminQueryOptions };
