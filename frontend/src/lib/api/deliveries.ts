import { requestEnvelope, api } from "./client";
import { EMPTY_PAGINATION } from "./envelope";
import type {
  Address,
  Delivery,
  DeliveryAlert,
  DeliveryService,
  ListQuery,
  Order,
  PackageDetails,
  Paginated,
  Pagination,
  PriceBreakdown,
  ServiceType,
} from "@/types";

/* --------------------------------- Types ---------------------------------- */

export interface CreateAddressPayload {
  label: string;
  recipientName?: string;
  contactNumber?: string;
  addressLine: string;
  city: string;
  province?: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface CreateDeliveryPayload {
  pickupAddressId: string;
  deliveryAddressId: string;
  package: PackageDetails;
  serviceType: ServiceType;
  scheduledFor?: string;
  courierInstructions?: string;
  couponCode?: string;
}

export interface PriceQuoteRequest {
  pickupAddressId: string;
  deliveryAddressId: string;
  serviceType: ServiceType;
  packageWeight: number;
  couponCode?: string;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  geometry?: { latitude: number; longitude: number }[];
}

/* -------------------------------- Endpoints -------------------------------- */

export const addressesApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Address[]>({ url: "/addresses", params }).then(toPage<Address>),

  get: (id: string) => api.get<Address>(`/addresses/${id}`),

  create: (payload: CreateAddressPayload) => api.post<Address>("/addresses", payload),

  update: (id: string, payload: Partial<CreateAddressPayload>) =>
    api.patch<Address>(`/addresses/${id}`, payload),

  remove: (id: string) => api.delete<void>(`/addresses/${id}`),

  setDefault: (id: string) => api.patch<Address>(`/addresses/${id}/default`),
};

export const servicesApi = {
  list: () => api.get<DeliveryService[]>("/deliveries/services"),
};

export const deliveriesApi = {
  /** Calculate a price quote on the server. Never trusted from the client. */
  calculatePrice: (payload: PriceQuoteRequest) =>
    api.post<PriceBreakdown & { estimatedPickup: string; estimatedDelivery: string }>(
      "/deliveries/calculate-price",
      payload,
      { skipErrorToast: true },
    ),

  create: (payload: CreateDeliveryPayload) =>
    api.post<Delivery>("/deliveries", payload, { skipErrorToast: true, successMessage: "Delivery created" }),

  list: (params?: ListQuery) =>
    requestEnvelope<Delivery[]>({ url: "/deliveries", params }).then(toPage<Delivery>),

  get: (id: string) => api.get<Delivery>(`/deliveries/${id}`),

  update: (id: string, payload: Partial<CreateDeliveryPayload>) =>
    api.patch<Delivery>(`/deliveries/${id}`, payload),

  cancel: (id: string, reason: string) =>
    api.post<Delivery>(`/deliveries/${id}/cancel`, { reason }),

  remove: (id: string) => api.delete<void>(`/deliveries/${id}`),

  review: (id: string, payload: { rating: number; comment?: string; courierRating?: number }) =>
    api.post<import("@/types").Review>(`/deliveries/${id}/review`, payload),

  myReviews: () => api.get<import("@/types").Review[]>("/deliveries/reviews/me"),

  alerts: () => api.get<DeliveryAlert[]>("/deliveries/alerts"),

  distance: (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) =>
    api.get<DistanceResult>("/deliveries/distance", {
      params: { fromLat: from.latitude, fromLng: from.longitude, toLat: to.latitude, toLng: to.longitude },
      skipErrorToast: true,
    }),
};

export const ordersApi = {
  list: (params?: ListQuery) =>
    requestEnvelope<Order[]>({ url: "/orders", params }).then(toPage<Order>),

  get: (id: string) => api.get<Order>(`/orders/${id}`),

  status: (id: string) => api.get<{ status: import("@/types").OrderStatus; paymentStatus: import("@/types").PaymentStatus }>(`/orders/${id}/status`),

  history: (id: string) => api.get<Order["statusHistory"]>(`/orders/${id}/history`),

  cancel: (id: string, reason: string) => api.post<Order>(`/orders/${id}/cancel`, { reason }),

  reorder: (id: string) => api.post<Delivery>(`/orders/${id}/reorder`),
};

/* --------------------------------- Utils ---------------------------------- */

/** Convert an envelope response into a page + pagination pair. */
export async function toPage<T>(r: {
  data: T[];
  pagination?: Pagination;
}): Promise<Paginated<T>> {
  return {
    items: r.data ?? [],
    pagination: r.pagination ?? EMPTY_PAGINATION,
  };
}
