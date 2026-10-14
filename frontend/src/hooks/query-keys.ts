/**
 * Centralised TanStack Query key factory.
 * Hierarchical keys keep invalidation predictable and avoid stale reads.
 */

export const qk = {
  /* --------------------------------- Auth -------------------------------- */
  auth: {
    all: ["auth"] as const,
    me: () => [...qk.auth.all, "me"] as const,
    sessions: () => [...qk.auth.all, "sessions"] as const,
  },

  /* ------------------------------ Dashboard ------------------------------ */
  dashboard: {
    all: ["dashboard"] as const,
    customer: () => [...qk.dashboard.all, "customer"] as const,
    admin: () => [...qk.dashboard.all, "admin"] as const,
  },

  /* ------------------------------ Addresses ----------------------------- */
  addresses: {
    all: ["addresses"] as const,
    list: (params?: Record<string, unknown>) => [...qk.addresses.all, "list", params ?? {}] as const,
    detail: (id: string) => [...qk.addresses.all, "detail", id] as const,
  },

  /* ------------------------------ Deliveries ---------------------------- */
  deliveries: {
    all: ["deliveries"] as const,
    list: (params?: Record<string, unknown>) => [...qk.deliveries.all, "list", params ?? {}] as const,
    detail: (id: string) => [...qk.deliveries.all, "detail", id] as const,
    reviews: () => [...qk.deliveries.all, "reviews"] as const,
    alerts: () => [...qk.deliveries.all, "alerts"] as const,
    services: ["deliveries", "services"] as const,
  },

  /* -------------------------------- Orders ------------------------------- */
  orders: {
    all: ["orders"] as const,
    list: (params?: Record<string, unknown>) => [...qk.orders.all, "list", params ?? {}] as const,
    detail: (id: string) => [...qk.orders.all, "detail", id] as const,
    history: (id: string) => [...qk.orders.all, "history", id] as const,
  },

  /* ------------------------------- Payments ------------------------------ */
  payments: {
    all: ["payments"] as const,
    list: (params?: Record<string, unknown>) => [...qk.payments.all, "list", params ?? {}] as const,
    detail: (id: string) => [...qk.payments.all, "detail", id] as const,
    stats: () => [...qk.payments.all, "stats"] as const,
  },

  /* -------------------------------- Wallet ------------------------------- */
  wallet: {
    all: ["wallet"] as const,
    get: () => [...qk.wallet.all, "balance"] as const,
    transactions: (params?: Record<string, unknown>) =>
      [...qk.wallet.all, "transactions", params ?? {}] as const,
  },

  /* ------------------------------- Coupons ------------------------------- */
  coupons: {
    all: ["coupons"] as const,
    available: () => [...qk.coupons.all, "available"] as const,
    mine: () => [...qk.coupons.all, "mine"] as const,
    adminList: (params?: Record<string, unknown>) => [...qk.coupons.all, "admin", params ?? {}] as const,
    adminDetail: (id: string) => [...qk.coupons.all, "admin", "detail", id] as const,
  },

  /* ------------------------------ Tracking ------------------------------- */
  tracking: {
    all: ["tracking"] as const,
    current: (deliveryId: string) => [...qk.tracking.all, "current", deliveryId] as const,
    history: (deliveryId: string) => [...qk.tracking.all, "history", deliveryId] as const,
    public: (orderRef: string) => [...qk.tracking.all, "public", orderRef] as const,
  },

  /* ---------------------------- Notifications ---------------------------- */
  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, unknown>) => [...qk.notifications.all, "list", params ?? {}] as const,
    unread: () => [...qk.notifications.all, "unread"] as const,
    count: () => [...qk.notifications.all, "count"] as const,
  },

  /* ------------------------------- Support ------------------------------- */
  support: {
    all: ["support"] as const,
    tickets: (params?: Record<string, unknown>) => [...qk.support.all, "tickets", params ?? {}] as const,
    ticket: (id: string) => [...qk.support.all, "ticket", id] as const,
  },

  /* -------------------------------- Reviews ------------------------------ */
  reviews: {
    all: ["reviews"] as const,
    mine: () => [...qk.reviews.all, "mine"] as const,
    courier: (id: string, params?: Record<string, unknown>) =>
      [...qk.reviews.all, "courier", id, params ?? {}] as const,
  },

  /* -------------------------------- Profile ------------------------------ */
  profile: {
    all: ["profile"] as const,
    me: () => [...qk.profile.all, "me"] as const,
    preferences: () => [...qk.profile.all, "preferences"] as const,
  },

  /* -------------------------------- Admin ------------------------------- */
  admin: {
    all: ["admin"] as const,
    dashboard: () => [...qk.admin.all, "dashboard"] as const,
    customers: (params?: Record<string, unknown>) => [...qk.admin.all, "customers", params ?? {}] as const,
    customer: (id: string) => [...qk.admin.all, "customers", "detail", id] as const,
    customerOrders: (id: string, params?: Record<string, unknown>) =>
      [...qk.admin.all, "customers", id, "orders", params ?? {}] as const,
    customerPayments: (id: string, params?: Record<string, unknown>) =>
      [...qk.admin.all, "customers", id, "payments", params ?? {}] as const,
    orders: (params?: Record<string, unknown>) => [...qk.admin.all, "orders", params ?? {}] as const,
    order: (id: string) => [...qk.admin.all, "orders", "detail", id] as const,
    orderRecommendations: (id: string) => [...qk.admin.all, "orders", id, "recommendations"] as const,
    payments: (params?: Record<string, unknown>) => [...qk.admin.all, "payments", params ?? {}] as const,
    paymentStats: () => [...qk.admin.all, "payments", "stats"] as const,
    couriers: (params?: Record<string, unknown>) => [...qk.admin.all, "couriers", params ?? {}] as const,
    courier: (id: string) => [...qk.admin.all, "couriers", "detail", id] as const,
    vehicles: (params?: Record<string, unknown>) => [...qk.admin.all, "vehicles", params ?? {}] as const,
    liveDeliveries: (params?: Record<string, unknown>) =>
      [...qk.admin.all, "deliveries", "live", params ?? {}] as const,
    operations: () => [...qk.admin.all, "operations"] as const,
    promotions: (params?: Record<string, unknown>) => [...qk.admin.all, "promotions", params ?? {}] as const,
    tickets: (params?: Record<string, unknown>) => [...qk.admin.all, "tickets", params ?? {}] as const,
    ticket: (id: string) => [...qk.admin.all, "tickets", "detail", id] as const,
    notifications: (params?: Record<string, unknown>) =>
      [...qk.admin.all, "notifications", params ?? {}] as const,
    auditLogs: (params?: Record<string, unknown>) => [...qk.admin.all, "audit", params ?? {}] as const,
    settings: () => [...qk.admin.all, "settings"] as const,
    analytics: (range?: Record<string, unknown>) => [...qk.admin.all, "analytics", range ?? {}] as const,
    analyticsOverview: (range?: Record<string, unknown>) =>
      [...qk.admin.all, "analytics", "overview", range ?? {}] as const,
  },
} as const;

/** Default query behaviour — cached, retried, deduplicated. */
export const QUERY_DEFAULTS = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  retry: (failureCount: number, error: Error): boolean => {
    // Never retry client errors — they are deterministic.
    const status = (error as { status?: number })?.status ?? 0;
    if (status >= 400 && status < 500) return false;
    return failureCount < 2;
  },
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;
