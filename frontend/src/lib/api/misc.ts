import { api, requestEnvelope } from "./client";
import { toPage } from "./deliveries";
import type {
  AppNotification,
  AuditLog,
  Coupon,
  CouponValidation,
  CustomerProfile,
  DeliveryService,
  ListQuery,
  Order,
  Paginated,
  Promotion,
  Review,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "@/types";

/* ------------------------------- Notifications ---------------------------- */

export const notificationsApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<AppNotification[]>({ url: "/notifications", params }).then(toPage<AppNotification>),

  unread: () => api.get<AppNotification[]>("/notifications/unread"),

  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),

  markRead: (id: string) => api.patch<AppNotification>(`/notifications/${id}/read`),

  markAllRead: () => api.patch<{ count: number }>("/notifications/read-all"),

  remove: (id: string) => api.delete<void>(`/notifications/${id}`),

  clearAll: () => api.delete<void>("/notifications"),
};

/* --------------------------------- Coupons -------------------------------- */

export interface CouponPayload {
  code: string;
  description?: string;
  discountType: Coupon["discountType"];
  discountValue: number;
  maximumDiscount?: number | null;
  minimumOrder: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  perCustomerLimit?: number;
  isActive: boolean;
}

export const couponsApi = {
  available: () => api.get<import("@/types").CouponWithState[]>("/coupons"),

  mine: () => api.get<import("@/types").CouponWithState[]>("/coupons/mine"),

  apply: (payload: { code: string; orderId?: string; amount?: number }) =>
    api.post<CouponValidation>("/coupons/apply", payload, { skipErrorToast: true }),

  validate: (code: string, amount: number) =>
    api.get<CouponValidation>(`/coupons/validate/${encodeURIComponent(code)}`, {
      params: { amount },
      skipErrorToast: true,
    }),
};

/* ------------------------------ Customer profile -------------------------- */

export const customerApi = {
  me: () => api.get<CustomerProfile>("/customers/me"),

  update: (payload: Partial<Pick<CustomerProfile, "firstName" | "lastName" | "phone" | "profileImage">>) =>
    api.patch<CustomerProfile>("/customers/me", payload, { successMessage: "Profile updated" }),

  preferences: () => api.get<import("@/types").NotificationPreferences>("/customers/me/preferences"),

  updatePreferences: (payload: Partial<import("@/types").NotificationPreferences>) =>
    api.patch<import("@/types").NotificationPreferences>("/customers/me/preferences", payload),
};

/* --------------------------------- Support -------------------------------- */

export interface CreateTicketPayload {
  subject: string;
  category: string;
  description: string;
  priority?: TicketPriority;
  orderRef?: string;
  attachments?: string[];
}

export const supportApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<SupportTicket[]>({ url: "/support/tickets", params }).then(toPage<SupportTicket>),

  get: (id: string) => api.get<SupportTicket>(`/support/tickets/${id}`),

  create: (payload: CreateTicketPayload) =>
    api.post<SupportTicket>("/support/tickets", payload, { successMessage: "Ticket created" }),

  reply: (id: string, body: string, attachments?: string[]) =>
    api.post<SupportTicket>(`/support/tickets/${id}/reply`, { body, attachments }),

  close: (id: string) => api.patch<SupportTicket>(`/support/tickets/${id}/close`, {}),
};

/* --------------------------------- Reviews -------------------------------- */

export const reviewsApi = {
  forCourier: (courierId: string, params?: ListQuery) =>
    requestEnvelope<Review[]>({ url: `/couriers/${courierId}/reviews`, params }).then(toPage<Review>),

  mine: () => api.get<Review[]>("/reviews/me"),
};

/* -------------------------------- Services -------------------------------- */

export const catalogApi = {
  deliveryServices: () => api.get<DeliveryService[]>("/services"),
};

/* ------------------------------ Public: contact --------------------------- */

export interface ContactMessagePayload {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  topic?: string;
  orderRef?: string;
}

/** Public contact form — no authentication required. */
export const contactApi = {
  send: (payload: ContactMessagePayload) =>
    api.post<{ reference: string; received: boolean }>("/contact", payload, {
      skipErrorToast: true,
      successMessage: "Message sent",
    }),
};

/* ------------------------------- Admin: audit ----------------------------- */

export const auditApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<AuditLog[]>({ url: "/admin/audit-logs", params }).then(toPage<AuditLog>),
};

export type AdminOrdersFilter = ListQuery & {
  status?: string;
  paymentStatus?: string;
  courierId?: string;
  customerId?: string;
  serviceType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminTicketsFilter = ListQuery & { status?: TicketStatus; priority?: TicketPriority };

export type { Order, Promotion, Paginated };
