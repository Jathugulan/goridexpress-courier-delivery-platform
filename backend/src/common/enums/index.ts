/**
 * Canonical domain enums.
 *
 * These strings are the single source of truth shared with the Next.js
 * frontend (`frontend/src/types/index.ts`). Never change a value without
 * updating the frontend contract.
 */

/* ---------------------------------- Roles --------------------------------- */

export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

/**
 * Fine-grained capability checks. The product exposes exactly two primary
 * roles, but the backend models permissions separately so admin scopes can
 * be split later without a migration.
 */
export enum Permission {
  MANAGE_CUSTOMERS = 'MANAGE_CUSTOMERS',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  MANAGE_COURIERS = 'MANAGE_COURIERS',
  MANAGE_VEHICLES = 'MANAGE_VEHICLES',
  MANAGE_DELIVERIES = 'MANAGE_DELIVERIES',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_COUPONS = 'MANAGE_COUPONS',
  MANAGE_PROMOTIONS = 'MANAGE_PROMOTIONS',
  MANAGE_SUPPORT = 'MANAGE_SUPPORT',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
}

export const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

/* --------------------------------- Orders --------------------------------- */

export enum OrderStatus {
  CREATED = 'CREATED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONFIRMED = 'CONFIRMED',
  COURIER_ASSIGNMENT = 'COURIER_ASSIGNMENT',
  COURIER_ASSIGNED = 'COURIER_ASSIGNED',
  COURIER_ARRIVING = 'COURIER_ARRIVING',
  COURIER_ACCEPTED = 'COURIER_ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  NEAR_DESTINATION = 'NEAR_DESTINATION',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/** Happy-path progression, in order. Used for history timelines and next-step hints. */
export const ORDER_FLOW: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.PAYMENT_SUCCESS,
  OrderStatus.CONFIRMED,
  OrderStatus.COURIER_ASSIGNMENT,
  OrderStatus.COURIER_ASSIGNED,
  OrderStatus.COURIER_ACCEPTED,
  OrderStatus.COURIER_ARRIVING,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
  OrderStatus.NEAR_DESTINATION,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

/** Statuses that mean a courier is actively working the job. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.COURIER_ASSIGNMENT,
  OrderStatus.COURIER_ASSIGNED,
  OrderStatus.COURIER_ACCEPTED,
  OrderStatus.COURIER_ARRIVING,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
  OrderStatus.NEAR_DESTINATION,
  OrderStatus.OUT_FOR_DELIVERY,
];

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.DELIVERY_FAILED,
  OrderStatus.REFUNDED,
];

/** Allowed admin/courier transitions. Anything else is rejected. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [
    OrderStatus.PAYMENT_SUCCESS,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_SUCCESS]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.COURIER_ASSIGNMENT, OrderStatus.CANCELLED],
  [OrderStatus.COURIER_ASSIGNMENT]: [
    OrderStatus.COURIER_ASSIGNED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.COURIER_ASSIGNED]: [
    OrderStatus.COURIER_ACCEPTED,
    OrderStatus.COURIER_ARRIVING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.COURIER_ACCEPTED]: [
    OrderStatus.COURIER_ARRIVING,
    OrderStatus.PICKED_UP,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.COURIER_ARRIVING]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.NEAR_DESTINATION, OrderStatus.DELIVERY_FAILED],
  [OrderStatus.NEAR_DESTINATION]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERY_FAILED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.DELIVERY_FAILED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.DELIVERY_FAILED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

/* -------------------------------- Payments -------------------------------- */

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  PENDING_COD = 'PENDING_COD',
  COD_COLLECTED = 'COD_COLLECTED',
  COD_PENDING = 'COD_PENDING',
}

export enum PaymentMethod {
  DUMMY_CARD = 'DUMMY_CARD',
  DUMMY_WALLET = 'DUMMY_WALLET',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  DUMMY_MOBILE = 'DUMMY_MOBILE',
}

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.PENDING_COD,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PROCESSING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUND_PENDING],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
  [PaymentStatus.CANCELLED]: [],
  [PaymentStatus.REFUND_PENDING]: [PaymentStatus.REFUNDED, PaymentStatus.PAID],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.PENDING_COD]: [PaymentStatus.COD_COLLECTED, PaymentStatus.COD_PENDING],
  [PaymentStatus.COD_COLLECTED]: [PaymentStatus.REFUND_PENDING],
  [PaymentStatus.COD_PENDING]: [PaymentStatus.COD_COLLECTED],
};

/** Demo card numbers. Never persisted, only compared. */
export const DEMO_CARDS = {
  SUCCESS: '4242424242424242',
  FAILURE: '4000000000000002',
} as const;

export const DEMO_WALLET_TOPUP_AMOUNTS = [10, 25, 50, 100] as const;

/* ------------------------------- Deliveries -------------------------------- */

export enum ServiceType {
  INSTANT = 'INSTANT',
  SAME_DAY = 'SAME_DAY',
  REGULAR = 'REGULAR',
  SCHEDULED = 'SCHEDULED',
}

export enum PackageType {
  DOCUMENT = 'DOCUMENT',
  SMALL_PARCEL = 'SMALL_PARCEL',
  MEDIUM_PARCEL = 'MEDIUM_PARCEL',
  LARGE_PARCEL = 'LARGE_PARCEL',
  FOOD = 'FOOD',
  OTHER = 'OTHER',
}

/** Mirrors `VehicleType` in the frontend contract. */
export enum VehicleType {
  BIKE = 'BIKE',
  THREE_WHEELER = 'THREE_WHEELER',
  CAR = 'CAR',
  VAN = 'VAN',
  WALK = 'WALK',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

/* -------------------------------- Couriers -------------------------------- */

export enum CourierStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/** Statuses that make a courier eligible for automatic assignment. */
export const ASSIGNABLE_COURIER_STATUSES: CourierStatus[] = [
  CourierStatus.ONLINE,
  CourierStatus.OFFLINE,
];

/* ------------------------------- Addresses -------------------------------- */

export enum AddressLabel {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
  SCHOOL = 'SCHOOL',
  FAVORITE = 'FAVORITE',
  OTHER = 'OTHER',
}

/* -------------------------------- Coupons --------------------------------- */

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_DELIVERY = 'FREE_DELIVERY',
}

export type CouponState = 'AVAILABLE' | 'USED' | 'EXPIRED' | 'INACTIVE';

/* -------------------------------- Support --------------------------------- */

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING = 'WAITING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/* ----------------------------- Notifications ------------------------------ */

/**
 * Mirrors `NotificationType` in `frontend/src/types/index.ts` exactly.
 * Both customer-facing and admin-facing notifications reuse this union.
 */
export enum NotificationType {
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  COURIER_ASSIGNED = 'COURIER_ASSIGNED',
  COURIER_ACCEPTED = 'COURIER_ACCEPTED',
  COURIER_ARRIVING = 'COURIER_ARRIVING',
  PACKAGE_PICKED_UP = 'PACKAGE_PICKED_UP',
  COURIER_NEARBY = 'COURIER_NEARBY',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  COUPON_APPLIED = 'COUPON_APPLIED',
  SUPPORT_REPLY = 'SUPPORT_REPLY',
  PROMOTION = 'PROMOTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum NotificationAudience {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

/* --------------------------------- Wallet --------------------------------- */

export enum WalletTransactionType {
  DEMO_TOPUP = 'DEMO_TOPUP',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum WalletTransactionStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

/* --------------------------------- Audit ---------------------------------- */

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  CREATE_ORDER = 'CREATE_ORDER',
  UPDATE_ORDER = 'UPDATE_ORDER',
  CANCEL_ORDER = 'CANCEL_ORDER',
  ASSIGN_COURIER = 'ASSIGN_COURIER',
  UNASSIGN_COURIER = 'UNASSIGN_COURIER',
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_CREATED = 'REFUND_CREATED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  COD_COLLECTED = 'COD_COLLECTED',
  CUSTOMER_BLOCKED = 'CUSTOMER_BLOCKED',
  CUSTOMER_UNBLOCKED = 'CUSTOMER_UNBLOCKED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  COURIER_CREATED = 'COURIER_CREATED',
  COURIER_UPDATED = 'COURIER_UPDATED',
  COURIER_APPROVED = 'COURIER_APPROVED',
  COURIER_SUSPENDED = 'COURIER_SUSPENDED',
  VEHICLE_CREATED = 'VEHICLE_CREATED',
  VEHICLE_UPDATED = 'VEHICLE_UPDATED',
  VEHICLE_DELETED = 'VEHICLE_DELETED',
  COUPON_CREATED = 'COUPON_CREATED',
  COUPON_UPDATED = 'COUPON_UPDATED',
  COUPON_DELETED = 'COUPON_DELETED',
  PROMOTION_CREATED = 'PROMOTION_CREATED',
  PROMOTION_UPDATED = 'PROMOTION_UPDATED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  SUPPORT_TICKET_UPDATED = 'SUPPORT_TICKET_UPDATED',
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  ADDRESS_CREATED = 'ADDRESS_CREATED',
  ADDRESS_UPDATED = 'ADDRESS_UPDATED',
  ADDRESS_DELETED = 'ADDRESS_DELETED',
  REVIEW_CREATED = 'REVIEW_CREATED',
}

/* ------------------------------ Error codes ------------------------------- */

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_WALLET_BALANCE = 'INSUFFICIENT_WALLET_BALANCE',
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
