import { api, requestEnvelope } from "./client";
import { toPage } from "./deliveries";
import type {
  AdminAnalytics,
  AnalyticsRange,
  AuditLog,
  Coupon,
  Courier,
  CustomerProfile,
  Delivery,
  ListQuery,
  LiveDelivery,
  OperationsSnapshot,
  Order,
  Paginated,
  Payment,
  Promotion,
  Review,
  ServiceType,
  SupportTicket,
  TicketPriority,
  TicketStatus,
  Vehicle,
} from "@/types";
import type { CouponPayload } from "./misc";
import type { RefundPayload } from "./payments";

/* --------------------------------- Types ---------------------------------- */

export interface CourierPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status?: Courier["status"];
  isVerified?: boolean;
  vehicleId?: string | null;
}

export interface VehiclePayload {
  type: Vehicle["type"];
  registrationNumber: string;
  model: string;
  color?: string;
  courierId?: string | null;
  status?: Vehicle["status"];
}

export interface PromotionPayload {
  title: string;
  subtitle?: string;
  description?: string;
  code?: string | null;
  badgeText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  displayOrder?: number;
  bannerImage?: string | null;
}

export interface UpdateOrderPayload {
  status?: Order["status"];
  courierId?: string | null;
  etaMinutes?: number;
  note?: string;
}

export interface CourierRecommendation {
  courier: Courier;
  distanceKm: number;
  etaMinutes: number;
  reason: string;
  score: number;
}

/* -------------------------------- Analytics ------------------------------- */

export const analyticsApi = {
  overview: (range?: Partial<AnalyticsRange>) =>
    api.get<AdminAnalytics["overview"]>("/admin/analytics/overview", { params: range }),

  full: (range?: Partial<AnalyticsRange>) =>
    api.get<AdminAnalytics>("/admin/analytics", { params: range }),

  orders: (range?: Partial<AnalyticsRange>) => api.get<AdminAnalytics["orders"]>("/admin/analytics/orders", { params: range }),

  payments: (range?: Partial<AnalyticsRange>) => api.get<AdminAnalytics["payments"]>("/admin/analytics/payments", { params: range }),

  deliveries: (range?: Partial<AnalyticsRange>) => api.get<AdminAnalytics["deliveries"]>("/admin/analytics/deliveries", { params: range }),

  customers: (range?: Partial<AnalyticsRange>) => api.get<AdminAnalytics["customers"]>("/admin/analytics/customers", { params: range }),

  couriers: (range?: Partial<AnalyticsRange>) => api.get<AdminAnalytics["couriers"]>("/admin/analytics/couriers", { params: range }),

  heatmap: (range?: Partial<AnalyticsRange>) => api.get<AdminAnalytics["heatmap"]>("/admin/analytics/heatmap", { params: range }),

  export: (entity: "orders" | "customers" | "payments" | "couriers" | "tickets" | "analytics", format: "csv" | "pdf", range?: Partial<AnalyticsRange>) =>
    api.get<{ url: string }>(`/admin/exports/${entity}`, { params: { format, ...range } }),
};

/* -------------------------------- Customers ------------------------------- */

export const adminCustomersApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<CustomerProfile[]>({ url: "/admin/customers", params }).then(toPage<CustomerProfile>),

  get: (id: string) => api.get<CustomerProfile>(`/admin/customers/${id}`),

  update: (id: string, payload: Partial<Pick<CustomerProfile, "firstName" | "lastName" | "phone">>) =>
    api.patch<CustomerProfile>(`/admin/customers/${id}`, payload, { successMessage: "Customer updated" }),

  block: (id: string, reason: string) =>
    api.post<void>(`/admin/customers/${id}/block`, { reason }, { successMessage: "Customer blocked" }),

  unblock: (id: string) =>
    api.post<void>(`/admin/customers/${id}/unblock`, {}, { successMessage: "Customer unblocked" }),

  orders: (id: string, params?: ListQuery) =>
    requestEnvelope<Order[]>({ url: `/admin/customers/${id}/orders`, params }).then(toPage<Order>),

  payments: (id: string, params?: ListQuery) =>
    requestEnvelope<Payment[]>({ url: `/admin/customers/${id}/payments`, params }).then(toPage<Payment>),

  wallet: (id: string) => api.get<import("@/types").Wallet>(`/admin/customers/${id}/wallet`),

  tickets: (id: string, params?: ListQuery) =>
    requestEnvelope<SupportTicket[]>({ url: `/admin/customers/${id}/tickets`, params }).then(toPage<SupportTicket>),
};

/* ---------------------------------- Orders -------------------------------- */

export const adminOrdersApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Order[]>({ url: "/admin/orders", params }).then(toPage<Order>),

  get: (id: string) => api.get<Order>(`/admin/orders/${id}`),

  update: (id: string, payload: UpdateOrderPayload) =>
    api.patch<Order>(`/admin/orders/${id}`, payload, { successMessage: "Order updated" }),

  assignCourier: (id: string, courierId: string) =>
    api.post<Order>(`/admin/orders/${id}/assign-courier`, { courierId }, { successMessage: "Courier assigned" }),

  unassignCourier: (id: string, reason: string) =>
    api.post<Order>(`/admin/orders/${id}/unassign-courier`, { reason }),

  cancel: (id: string, reason: string) =>
    api.post<Order>(`/admin/orders/${id}/cancel`, { reason }, { successMessage: "Order cancelled" }),

  recommendCouriers: (id: string) =>
    api.get<CourierRecommendation[]>(`/admin/orders/${id}/courier-recommendations`),

  advanceStatus: (id: string, status: Order["status"], note?: string) =>
    api.post<Order>(`/admin/orders/${id}/status`, { status, note }, { successMessage: "Status updated" }),

  refund: (id: string, payload: RefundPayload) => api.post<Payment>(`/admin/orders/${id}/refund`, payload),
};

/* --------------------------------- Payments ------------------------------- */

export const adminPaymentsApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Payment[]>({ url: "/admin/payments", params }).then(toPage<Payment>),

  get: (id: string) => api.get<Payment>(`/admin/payments/${id}`),

  stats: () => api.get<AdminAnalytics["payments"] & Record<string, never>>("/admin/payments/stats"),

  refund: (id: string, payload: RefundPayload) =>
    api.post<Payment>(`/admin/payments/${id}/refund`, payload, {
      successMessage: "Demo refund completed successfully",
    }),

  codCollect: (id: string, payload: { collected: boolean; note?: string }) =>
    api.post<Payment>(`/admin/payments/cod/collect`, { paymentId: id, ...payload }, {
      successMessage: payload.collected ? "COD marked collected" : "COD marked pending",
    }),

  codPending: (params?: ListQuery) =>
    requestEnvelope<Payment[]>({ url: "/admin/payments/cod-pending", params }).then(toPage<Payment>),
};

/* ------------------------------ Couriers / vehicles ------------------------ */

export const adminCouriersApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Courier[]>({ url: "/admin/couriers", params }).then(toPage<Courier>),

  get: (id: string) => api.get<Courier>(`/admin/couriers/${id}`),

  create: (payload: CourierPayload) => api.post<Courier>("/admin/couriers", payload, { successMessage: "Courier created" }),

  update: (id: string, payload: Partial<CourierPayload> & { status?: Courier["status"] }) =>
    api.patch<Courier>(`/admin/couriers/${id}`, payload, { successMessage: "Courier updated" }),

  remove: (id: string) => api.delete<void>(`/admin/couriers/${id}`),

  approve: (id: string) =>
    api.post<Courier>(`/admin/couriers/${id}/approve`, {}, { successMessage: "Courier approved" }),

  suspend: (id: string, reason: string) =>
    api.post<Courier>(`/admin/couriers/${id}/suspend`, { reason }, { successMessage: "Courier suspended" }),

  activate: (id: string) =>
    api.post<Courier>(`/admin/couriers/${id}/activate`, {}, { successMessage: "Courier reactivated" }),

  setStatus: (id: string, status: Courier["status"]) =>
    api.patch<Courier>(`/admin/couriers/${id}`, { status }, { successMessage: "Status updated" }),

  assignVehicle: (id: string, vehicleId: string | null) =>
    api.patch<Courier>(`/admin/couriers/${id}/vehicle`, { vehicleId }),

  reviews: (id: string, params?: ListQuery) =>
    requestEnvelope<Review[]>({ url: `/admin/couriers/${id}/reviews`, params }).then(toPage<Review>),

  performance: (id: string) => api.get<AdminAnalytics["couriers"]["performance"][number]>(`/admin/couriers/${id}/performance`),
};

export const adminVehiclesApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Vehicle[]>({ url: "/admin/vehicles", params }).then(toPage<Vehicle>),

  get: (id: string) => api.get<Vehicle>(`/admin/vehicles/${id}`),

  create: (payload: VehiclePayload) => api.post<Vehicle>("/admin/vehicles", payload, { successMessage: "Vehicle created" }),

  update: (id: string, payload: Partial<VehiclePayload>) =>
    api.patch<Vehicle>(`/admin/vehicles/${id}`, payload, { successMessage: "Vehicle updated" }),

  remove: (id: string) => api.delete<void>(`/admin/vehicles/${id}`),
};

/* ------------------------------ Live deliveries --------------------------- */

export const adminDeliveriesApi = {
  live: (params?: ListQuery) =>
    requestEnvelope<LiveDelivery[]>({ url: "/admin/deliveries/live", params }).then(toPage<LiveDelivery>),

  snapshot: () => api.get<OperationsSnapshot>("/admin/deliveries/snapshot"),

  list: (params?: ListQuery) =>
    requestEnvelope<Delivery[]>({ url: "/admin/deliveries", params }).then(toPage<Delivery>),

  get: (id: string) => api.get<Delivery>(`/admin/deliveries/${id}`),

  tracking: (id: string) => api.get<import("@/lib/api/tracking").TrackingResponse>(`/admin/deliveries/${id}/tracking`),

  advanceStatus: (id: string, status: Order["status"], note?: string) =>
    api.post<Delivery>(`/admin/deliveries/${id}/status`, { status, note }, { successMessage: "Status updated" }),

  simulateCourier: (id: string) => api.post<void>(`/admin/deliveries/${id}/simulate`),
};

/* ------------------------- Coupons / promotions / tickets ----------------- */

export const adminCouponsApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Coupon[]>({ url: "/admin/coupons", params }).then(toPage<Coupon>),

  get: (id: string) => api.get<Coupon>(`/admin/coupons/${id}`),

  create: (payload: CouponPayload) => api.post<Coupon>("/admin/coupons", payload, { successMessage: "Coupon created" }),

  update: (id: string, payload: Partial<CouponPayload>) =>
    api.patch<Coupon>(`/admin/coupons/${id}`, payload, { successMessage: "Coupon updated" }),

  remove: (id: string) => api.delete<void>(`/admin/coupons/${id}`),

  toggle: (id: string, isActive: boolean) =>
    api.patch<Coupon>(`/admin/coupons/${id}`, { isActive }, { successMessage: isActive ? "Coupon activated" : "Coupon deactivated" }),
};

export const adminPromotionsApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Promotion[]>({ url: "/admin/promotions", params }).then(toPage<Promotion>),

  get: (id: string) => api.get<Promotion>(`/admin/promotions/${id}`),

  create: (payload: PromotionPayload) => api.post<Promotion>("/admin/promotions", payload, { successMessage: "Promotion created" }),

  update: (id: string, payload: Partial<PromotionPayload>) =>
    api.patch<Promotion>(`/admin/promotions/${id}`, payload, { successMessage: "Promotion updated" }),

  remove: (id: string) => api.delete<void>(`/admin/promotions/${id}`),

  toggle: (id: string, isActive: boolean) =>
    api.patch<Promotion>(`/admin/promotions/${id}`, { isActive }),
};

export const adminSupportApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<SupportTicket[]>({ url: "/admin/support/tickets", params }).then(toPage<SupportTicket>),

  get: (id: string) => api.get<SupportTicket>(`/admin/support/tickets/${id}`),

  update: (id: string, payload: { status?: TicketStatus; priority?: TicketPriority; assignedAdminId?: string | null }) =>
    api.patch<SupportTicket>(`/admin/support/tickets/${id}`, payload, { successMessage: "Ticket updated" }),

  reply: (id: string, body: string) => api.post<SupportTicket>(`/admin/support/tickets/${id}/reply`, { body }),

  close: (id: string) => api.patch<SupportTicket>(`/admin/support/tickets/${id}/close`, {}),
};

/* --------------------------------- Settings ------------------------------- */

export const adminSettingsApi = {
  get: () => api.get<import("@/types").AppSettings>("/admin/settings"),

  update: (payload: Partial<import("@/types").AppSettings>) =>
    api.patch<import("@/types").AppSettings>("/admin/settings", payload, { successMessage: "Settings saved" }),
};

export const adminAuditApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<AuditLog[]>({ url: "/admin/audit-logs", params }).then(toPage<AuditLog>),
};

export const adminNotificationsApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<import("@/types").AppNotification[]>({ url: "/admin/notifications", params }).then(
      toPage<import("@/types").AppNotification>,
    ),
  unreadCount: () => api.get<{ count: number }>("/admin/notifications/unread-count"),
  markRead: (id: string) => api.patch<void>(`/admin/notifications/${id}/read`),
  markAllRead: () => api.patch<{ count: number }>("/admin/notifications/read-all"),
};

export const adminDashboardApi = {
  get: () => api.get<OperationsSnapshot & { metrics: import("@/types").AdminOverviewMetrics }>("/admin/dashboard"),
};

export type { Paginated, ServiceType };
