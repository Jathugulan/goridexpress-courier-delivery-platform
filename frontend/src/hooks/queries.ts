"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/envelope";
import { authApi, roleHome } from "@/lib/api/auth";
import { dashboardApi } from "@/lib/api/dashboard";
import { customerApi, notificationsApi, supportApi, reviewsApi, couponsApi, contactApi } from "@/lib/api/misc";
import { addressesApi, deliveriesApi, ordersApi, servicesApi } from "@/lib/api/deliveries";
import type { CreatePaymentPayload, ProcessPaymentPayload } from "@/lib/api/payments";
import { paymentsApi, walletApi } from "@/lib/api/payments";
import { trackingApi } from "@/lib/api/tracking";
import { useAuthStore } from "@/store/auth-store";
import { qk } from "./query-keys";
import type {
  Address,
  AppNotification,
  AuthSession,
  CustomerDashboard,
  CustomerProfile,
  Delivery,
  ListQuery,
  Order,
  Paginated,
  Payment,
  SupportTicket,
  Wallet,
  WalletTransaction,
} from "@/types";
import type { CreateAddressPayload, CreateDeliveryPayload } from "@/lib/api/deliveries";
import type { CreateTicketPayload, ContactMessagePayload } from "@/lib/api/misc";

/* -------------------------------------------------------------------------- */
/*                              Error handling                                */
/* -------------------------------------------------------------------------- */

export function errorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) {
    if (error.isNetwork) return "Can't reach the GoRideXpress API. Check your connection and try again.";
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function notifyError(error: unknown, fallback: string) {
  toast.error("Something went wrong", { description: errorMessage(error, fallback) });
}

/* -------------------------------------------------------------------------- */
/*                             List query options                             */
/* -------------------------------------------------------------------------- */

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  [key: string]: unknown;
}

export function useListQuery<T>(options: {
  queryKey: readonly unknown[];
  fetcher: (params: ListParams) => Promise<Paginated<T>>;
  params: ListParams;
  enabled?: boolean;
  placeholderData?: UseQueryOptions<Paginated<T>>["placeholderData"];
  refetchInterval?: number | false;
}) {
  return useQuery({
    queryKey: options.queryKey,
    queryFn: () => options.fetcher(options.params),
    enabled: options.enabled,
    placeholderData: options.placeholderData,
    refetchInterval: options.refetchInterval,
  });
}

/* ======================================================================== */
/*                                   Auth                                    */
/* ======================================================================== */

export function useCurrentUser(options?: { enabled?: boolean }) {
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const setResolved = useAuthStore((s) => s.setResolved);

  return useQuery({
    queryKey: qk.auth.me(),
    queryFn: async () => {
      try {
        const session = await authApi.me();
        setSession(session.user);
        return session;
      } catch (error) {
        clear();
        throw error;
      } finally {
        setResolved(true);
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const routerRedirect = useAuthStore((s) => s.resolved);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (session: AuthSession) => {
      setSession(session.user);
      qc.setQueryData(qk.auth.me(), session);
      void qc.invalidateQueries();
      void routerRedirect;
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (session: AuthSession) => {
      setSession(session.user);
      qc.setQueryData(qk.auth.me(), session);
      void qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear();
      qc.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => toast.success("Password updated", { description: "Use your new password next time you sign in." }),
    onError: (e) => notifyError(e, "Could not update your password."),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onError: (e) => notifyError(e, "Could not send the reset link."),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      qc.clear();
      toast.success("Password reset", { description: "You can now sign in with your new password." });
    },
    onError: (e) => notifyError(e, "Could not reset your password."),
  });
}

export function useSessions() {
  return useQuery({ queryKey: qk.auth.sessions(), queryFn: authApi.sessions, staleTime: 60_000 });
}

/* ======================================================================== */
/*                                 Dashboard                                 */
/* ======================================================================== */

export function useCustomerDashboard() {
  return useQuery({
    queryKey: qk.dashboard.customer(),
    queryFn: dashboardApi.customer,
    staleTime: 20_000,
  });
}

/* ======================================================================== */
/*                                 Addresses                                 */
/* ======================================================================== */

export function useAddresses() {
  return useQuery({
    queryKey: qk.addresses.list(),
    queryFn: () => addressesApi.list(),
    staleTime: 5 * 60_000,
  });
}

export function useAddressMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.addresses.all });

  const create = useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressesApi.create(payload),
    onSuccess: () => {
      void invalidate();
      toast.success("Address saved");
    },
    onError: (e) => notifyError(e, "Could not save this address."),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAddressPayload> }) =>
      addressesApi.update(id, payload),
    onSuccess: () => {
      void invalidate();
      toast.success("Address updated");
    },
    onError: (e) => notifyError(e, "Could not update this address."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      toast.success("Address removed");
    },
    onError: (e) => notifyError(e, "Could not remove this address."),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => addressesApi.setDefault(id),
    onSuccess: () => void invalidate(),
  });

  return { create, update, remove, setDefault, isPending: create.isPending };
}

/* ======================================================================== */
/*                                 Deliveries                                */
/* ======================================================================== */

export function useDeliveryServices() {
  return useQuery({
    queryKey: qk.deliveries.services,
    queryFn: servicesApi.list,
    staleTime: 30 * 60_000,
  });
}

export function useDelivery(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.deliveries.detail(id ?? "none"),
    queryFn: () => deliveriesApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useDeliveries(params: ListParams) {
  return useListQuery({
    queryKey: qk.deliveries.list(params),
    fetcher: (p) => deliveriesApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDeliveryPayload) => deliveriesApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deliveries.all });
      void qc.invalidateQueries({ queryKey: qk.orders.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.all });
    },
    onError: (e) => notifyError(e, "Could not create the delivery."),
  });
}

export function useCancelDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deliveriesApi.cancel(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deliveries.all });
      void qc.invalidateQueries({ queryKey: qk.orders.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.all });
      toast.success("Delivery cancelled", { description: "Any demo payment will be refunded." });
    },
    onError: (e) => notifyError(e, "Could not cancel this delivery."),
  });
}

export function useDeliveryAlerts() {
  return useQuery({
    queryKey: qk.deliveries.alerts(),
    queryFn: deliveriesApi.alerts,
    staleTime: 60_000,
  });
}

/* ======================================================================== */
/*                                   Orders                                  */
/* ======================================================================== */

export function useOrders(params: ListParams) {
  return useListQuery({
    queryKey: qk.orders.list(params),
    fetcher: (p) => ordersApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.orders.detail(id ?? "none"),
    queryFn: () => ordersApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useOrderHistory(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.orders.history(id ?? "none"),
    queryFn: () => ordersApi.history(id as string),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => ordersApi.cancel(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.orders.all });
      void qc.invalidateQueries({ queryKey: qk.deliveries.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.all });
      toast.success("Order cancelled");
    },
    onError: (e) => notifyError(e, "Could not cancel this order."),
  });
}

export function useReorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.reorder(id),
    onSuccess: (delivery: Delivery) => {
      void qc.invalidateQueries({ queryKey: qk.deliveries.all });
      toast.success("Reorder created", { description: "Review the details before paying." });
      return delivery;
    },
    onError: (e) => notifyError(e, "Could not create the reorder."),
  });
}

/* ======================================================================== */
/*                                  Payments                                 */
/* ======================================================================== */

export function usePayments(params: ListParams) {
  return useListQuery({
    queryKey: qk.payments.list(params),
    fetcher: (p) => paymentsApi.customer(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function usePayment(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.payments.detail(id ?? "none"),
    queryFn: () => paymentsApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function usePaymentStats() {
  return useQuery({ queryKey: qk.payments.stats(), queryFn: paymentsApi.stats, staleTime: 60_000 });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onError: (e) => notifyError(e, "Could not start the demo payment."),
  });
}

export function useProcessPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: ProcessPaymentPayload;
      idempotencyKey: string;
    }) => paymentsApi.process(payload, idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.payments.all });
      void qc.invalidateQueries({ queryKey: qk.wallet.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.all });
      void qc.invalidateQueries({ queryKey: qk.orders.all });
    },
  });
}

/* ======================================================================== */
/*                                   Wallet                                  */
/* ======================================================================== */

export function useWallet() {
  return useQuery({ queryKey: qk.wallet.get(), queryFn: walletApi.get, staleTime: 20_000 });
}

export function useWalletTransactions(params: ListParams) {
  return useListQuery({
    queryKey: qk.wallet.transactions(params),
    fetcher: (p) => walletApi.transactions(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useAddDemoMoney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => walletApi.addDemoMoney(amount),
    onSuccess: (wallet: Wallet) => {
      void qc.invalidateQueries({ queryKey: qk.wallet.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.all });
      toast.success(`$${wallet.balance.toFixed(2)} demo balance`, {
        description: "Demo money added. No real funds were involved.",
      });
    },
    onError: (e) => notifyError(e, "Could not add demo money."),
  });
}

/* ======================================================================== */
/*                                  Coupons                                  */
/* ======================================================================== */

export function useCoupons() {
  return useQuery({
    queryKey: qk.coupons.available(),
    queryFn: couponsApi.available,
    staleTime: 5 * 60_000,
  });
}

export function useMyCoupons() {
  return useQuery({ queryKey: qk.coupons.mine(), queryFn: couponsApi.mine, staleTime: 5 * 60_000 });
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: (payload: { code: string; orderId?: string; amount?: number }) =>
      couponsApi.apply(payload),
    onError: (e) => notifyError(e, "This coupon could not be applied."),
  });
}

/* ======================================================================== */
/*                                  Tracking                                 */
/* ======================================================================== */

export function useTracking(deliveryId?: string, enabled = true) {
  return useQuery({
    queryKey: qk.tracking.current(deliveryId ?? "none"),
    queryFn: () => trackingApi.current(deliveryId as string),
    enabled: enabled && Boolean(deliveryId),
    refetchInterval: 120_000,
    staleTime: 15_000,
  });
}

export function usePublicTracking(orderRef?: string, enabled = true) {
  return useQuery({
    queryKey: qk.tracking.public(orderRef ?? "none"),
    queryFn: () => trackingApi.publicTrack(orderRef as string),
    enabled: enabled && Boolean(orderRef),
    retry: false,
    staleTime: 30_000,
  });
}

/* ======================================================================== */
/*                               Notifications                              */
/* ======================================================================== */

export function useNotifications(params: ListParams) {
  return useListQuery({
    queryKey: qk.notifications.list(params),
    fetcher: (p) => notificationsApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.notifications.count(),
    queryFn: notificationsApi.unreadCount,
    enabled: options?.enabled ?? true,
    staleTime: 20_000,
    refetchInterval: 60_000,
    select: (d) => d?.count ?? 0,
  });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: qk.notifications.all });
    void qc.invalidateQueries({ queryKey: qk.dashboard.all });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
    onError: (e) => notifyError(e, "Could not mark as read."),
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead, remove };
}

/* ======================================================================== */
/*                                   Support                                 */
/* ======================================================================== */

export function useSupportTickets(params: ListParams) {
  return useListQuery({
    queryKey: qk.support.tickets(params),
    fetcher: (p) => supportApi.list(p as ListQuery),
    params,
    placeholderData: (prev) => prev,
  });
}

export function useSupportTicket(id?: string, enabled = true) {
  return useQuery({
    queryKey: qk.support.ticket(id ?? "none"),
    queryFn: () => supportApi.get(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useSupportMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.support.all });

  const create = useMutation({
    mutationFn: (payload: CreateTicketPayload) => supportApi.create(payload),
    onSuccess: () => {
      void invalidate();
      toast.success("Ticket created", { description: "Our support team will reply shortly." });
    },
    onError: (e) => notifyError(e, "Could not create your ticket."),
  });

  const reply = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => supportApi.reply(id, body),
    onSuccess: () => {
      void invalidate();
      toast.success("Reply sent");
    },
    onError: (e) => notifyError(e, "Could not send your reply."),
  });

  const close = useMutation({
    mutationFn: (id: string) => supportApi.close(id),
    onSuccess: () => {
      void invalidate();
      toast.success("Ticket closed");
    },
  });

  return { create, reply, close };
}

/* ======================================================================== */
/*                                   Profile                                 */
/* ======================================================================== */

export function useProfile() {
  return useQuery({ queryKey: qk.profile.me(), queryFn: customerApi.me, staleTime: 5 * 60_000 });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);
  return useMutation({
    mutationFn: customerApi.update,
    onSuccess: (profile: CustomerProfile) => {
      patchUser({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
      void qc.invalidateQueries({ queryKey: qk.profile.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.all });
    },
    onError: (e) => notifyError(e, "Could not save your profile."),
  });
}

export function useNotificationPreferences() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.profile.preferences(),
    queryFn: customerApi.preferences,
    staleTime: 5 * 60_000,
  });

  const update = useMutation({
    mutationFn: customerApi.updatePreferences,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.profile.preferences() });
      toast.success("Preferences saved");
    },
    onError: (e) => notifyError(e, "Could not save your preferences."),
  });

  return { ...query, update };
}

/* ======================================================================== */
/*                                   Reviews                                 */
/* ======================================================================== */

export function useMyReviews() {
  return useQuery({ queryKey: qk.reviews.mine(), queryFn: reviewsApi.mine, staleTime: 5 * 60_000 });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { rating: number; comment?: string; courierRating?: number } }) =>
      deliveriesApi.review(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.deliveries.all });
      void qc.invalidateQueries({ queryKey: qk.reviews.all });
      toast.success("Thanks for your review!", { description: "Your feedback helps our couriers improve." });
    },
    onError: (e) => notifyError(e, "Could not submit your review."),
  });
}

/* ======================================================================== */
/*                          Public: contact form                            */
/* ======================================================================== */

export function useContactForm() {
  return useMutation({
    mutationFn: (payload: ContactMessagePayload) => contactApi.send(payload),
    onSuccess: () => {
      toast.success("Message sent", {
        description: "Our support team will reply to your email address shortly.",
      });
    },
    onError: (e) => notifyError(e, "Could not send your message."),
  });
}

/* ======================================================================== */
/*                              Auth helpers                                 */
/* ======================================================================== */

export { roleHome };

export type {
  Address,
  AppNotification,
  CustomerDashboard,
  CustomerProfile,
  Delivery,
  Order,
  Payment,
  SupportTicket,
  Wallet,
  WalletTransaction,
};
