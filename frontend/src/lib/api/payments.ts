import { api, requestEnvelope } from "./client";
import { toPage } from "./deliveries";
import type {
  DummyCardInput,
  ListQuery,
  Paginated,
  Payment,
  PaymentMethod,
  Wallet,
  WalletTransaction,
  WalletTransactionType,
} from "@/types";

/* --------------------------------- Types ---------------------------------- */

export interface CreatePaymentPayload {
  orderId: string;
  method: PaymentMethod;
}

export interface ProcessPaymentPayload {
  paymentId: string;
  method: PaymentMethod;
  card?: DummyCardInput;
  mobileNumber?: string;
  walletId?: string;
}

export interface RefundPayload {
  amount: number;
  reason: string;
  creditToWallet?: boolean;
}

export interface PaymentStats {
  demoRevenue: number;
  demoRevenueToday: number;
  totalTransactions: number;
  successful: number;
  failed: number;
  pending: number;
  refunded: number;
  codPending: number;
}

/* -------------------------------- Endpoints -------------------------------- */

export const paymentsApi = {
  /** Create a simulated payment intent for an order. */
  create: (payload: CreatePaymentPayload) =>
    api.post<Payment>("/payments/dummy/create", payload, { skipErrorToast: true }),

  /** Process a simulated payment. Send an Idempotency-Key header. */
  process: (payload: ProcessPaymentPayload, idempotencyKey: string) =>
    api.post<Payment>("/payments/dummy/process", payload, {
      skipErrorToast: true,
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  get: (id: string) => api.get<Payment>(`/payments/${id}`),

  customer: (params?: ListQuery) =>
    requestEnvelope<Payment[]>({ url: "/payments/customer", params }).then(toPage<Payment>),

  stats: () => api.get<PaymentStats>("/payments/customer/stats"),

  failDemo: (id: string, reason?: string) =>
    api.post<Payment>(`/payments/${id}/fail-demo`, { reason }, { skipErrorToast: true }),

  cancel: (id: string) => api.post<Payment>(`/payments/${id}/cancel`),

  /** Admin only. */
  adminStats: () => api.get<PaymentStats>("/admin/payments/stats"),
};

export const walletApi = {
  get: () => api.get<Wallet>("/wallet"),

  addDemoMoney: (amount: number) =>
    api.post<Wallet>("/wallet/demo/add-money", { amount }, { successMessage: "Demo money added" }),

  transactions: (params?: ListQuery) =>
    requestEnvelope<WalletTransaction[]>({ url: "/wallet/transactions", params }).then(
      toPage<WalletTransaction>,
    ),

  statement: (params?: ListQuery) =>
    requestEnvelope<WalletTransaction[]>({ url: "/wallet/statement", params }).then(
      toPage<WalletTransaction>,
    ),
};

export type PaginatedPayments = Paginated<Payment>;
export type { WalletTransactionType };
