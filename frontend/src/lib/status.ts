/**
 * Central status → visual tone registry.
 * Every status badge in the app resolves through this map so colour,
 * iconography and semantics stay consistent and accessible
 * (status is never communicated by colour alone — icon + text always ship).
 */

import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Bike,
  Box,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Clock,
  CreditCard,
  FileText,
  Hourglass,
  MapPin,
  Package,
  PackageCheck,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserCheck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  CourierStatus,
  NotificationType,
  OrderStatus,
  PackageType,
  PaymentMethod,
  PaymentStatus,
  ServiceType,
  TicketPriority,
  TicketStatus,
  VehicleType,
} from "@/types";
import {
  COURIER_STATUS_LABELS,
  NOTIFICATION_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  PACKAGE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  VEHICLE_LABELS,
} from "./format";

export type Tone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "purple";

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: LucideIcon;
  /** Screen-reader announcement prefix. */
  srPrefix?: string;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Order status                                */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  CREATED: { label: "Created", tone: "neutral", icon: CircleDashed, description: "Order created" },
  PAYMENT_PENDING: { label: "Payment Pending", tone: "warning", icon: Hourglass, description: "Awaiting payment" },
  PAYMENT_SUCCESS: { label: "Payment Success", tone: "success", icon: CheckCircle2, description: "Payment received" },
  PAYMENT_FAILED: { label: "Payment Failed", tone: "error", icon: XCircle, description: "Payment was declined" },
  CONFIRMED: { label: "Confirmed", tone: "info", icon: BadgeCheck, description: "Booking confirmed" },
  COURIER_ASSIGNMENT: { label: "Finding Courier", tone: "info", icon: PackageSearch, description: "Matching a courier" },
  COURIER_ASSIGNED: { label: "Courier Assigned", tone: "info", icon: UserCheck, description: "A courier is assigned" },
  COURIER_ACCEPTED: { label: "Courier Accepted", tone: "info", icon: CheckCircle2, description: "Courier accepted the job" },
  COURIER_ARRIVING: { label: "Courier Arriving", tone: "secondary", icon: MapPin, description: "Courier heading to pickup" },
  PICKED_UP: { label: "Picked Up", tone: "secondary", icon: Package, description: "Package collected" },
  IN_TRANSIT: { label: "In Transit", tone: "primary", icon: Truck, description: "On the way to destination" },
  NEAR_DESTINATION: { label: "Near Destination", tone: "primary", icon: MapPin, description: "Courier is close by" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", tone: "primary", icon: Bike, description: "Final mile delivery" },
  DELIVERED: { label: "Delivered", tone: "success", icon: PackageCheck, description: "Delivered successfully" },
  CANCELLED: { label: "Cancelled", tone: "error", icon: CircleSlash, description: "Delivery cancelled" },
  DELIVERY_FAILED: { label: "Delivery Failed", tone: "error", icon: XCircle, description: "Delivery attempt failed" },
  REFUNDED: { label: "Refunded", tone: "neutral", icon: RotateCcw, description: "Payment refunded" },
};

export const ORDER_FLOW: OrderStatus[] = [
  "CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_SUCCESS",
  "CONFIRMED",
  "COURIER_ASSIGNMENT",
  "COURIER_ASSIGNED",
  "COURIER_ACCEPTED",
  "COURIER_ARRIVING",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEAR_DESTINATION",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/** Customer-facing timeline milestones (fewer, more meaningful steps). */
export const CUSTOMER_TIMELINE: OrderStatus[] = [
  "CREATED",
  "PAYMENT_SUCCESS",
  "CONFIRMED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "DELIVERED",
  "CANCELLED",
  "DELIVERY_FAILED",
  "REFUNDED",
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "COURIER_ASSIGNMENT",
  "COURIER_ASSIGNED",
  "COURIER_ACCEPTED",
  "COURIER_ARRIVING",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEAR_DESTINATION",
  "OUT_FOR_DELIVERY",
];

export function isTerminalStatus(status: OrderStatus) {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function isActiveStatus(status: OrderStatus) {
  return ACTIVE_ORDER_STATUSES.includes(status);
}

/** Progress percentage for a delivery status (SRS § Smart ETA). */
export function statusProgress(status: OrderStatus): number {
  const map: Partial<Record<OrderStatus, number>> = {
    CREATED: 2,
    PAYMENT_PENDING: 5,
    PAYMENT_SUCCESS: 8,
    PAYMENT_FAILED: 5,
    CONFIRMED: 12,
    COURIER_ASSIGNMENT: 18,
    COURIER_ASSIGNED: 25,
    COURIER_ACCEPTED: 30,
    COURIER_ARRIVING: 38,
    PICKED_UP: 46,
    IN_TRANSIT: 62,
    NEAR_DESTINATION: 80,
    OUT_FOR_DELIVERY: 90,
    DELIVERED: 100,
    CANCELLED: 0,
    DELIVERY_FAILED: 60,
    REFUNDED: 100,
  };
  return map[status] ?? 0;
}

/* -------------------------------------------------------------------------- */
/*                               Payment status                               */
/* -------------------------------------------------------------------------- */

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: "Pending", tone: "warning", icon: Hourglass },
  PROCESSING: { label: "Processing", tone: "info", icon: Clock },
  PAID: { label: "Paid", tone: "success", icon: CheckCircle2 },
  FAILED: { label: "Failed", tone: "error", icon: XCircle },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: CircleSlash },
  REFUND_PENDING: { label: "Refund Pending", tone: "warning", icon: RotateCcw },
  REFUNDED: { label: "Refunded", tone: "neutral", icon: RotateCcw },
  PENDING_COD: { label: "COD Pending", tone: "warning", icon: Banknote },
  COD_COLLECTED: { label: "COD Collected", tone: "success", icon: CheckCircle2 },
  COD_PENDING: { label: "COD Pending", tone: "warning", icon: Banknote },
};

export const PAYMENT_METHOD_META: Record<PaymentMethod, StatusMeta> = {
  DUMMY_CARD: { label: PAYMENT_METHOD_LABELS.DUMMY_CARD, tone: "primary", icon: CreditCard },
  DUMMY_WALLET: { label: PAYMENT_METHOD_LABELS.DUMMY_WALLET, tone: "purple", icon: Wallet },
  CASH_ON_DELIVERY: { label: PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY, tone: "warning", icon: Banknote },
  DUMMY_MOBILE: { label: PAYMENT_METHOD_LABELS.DUMMY_MOBILE, tone: "info", icon: CreditCard },
};

/* -------------------------------------------------------------------------- */
/*                                Courier status                              */
/* -------------------------------------------------------------------------- */

export const COURIER_STATUS_META: Record<CourierStatus, StatusMeta> = {
  ONLINE: { label: COURIER_STATUS_LABELS.ONLINE, tone: "success", icon: CheckCircle2 },
  OFFLINE: { label: COURIER_STATUS_LABELS.OFFLINE, tone: "neutral", icon: CircleDashed },
  BUSY: { label: COURIER_STATUS_LABELS.BUSY, tone: "warning", icon: Truck },
  SUSPENDED: { label: COURIER_STATUS_LABELS.SUSPENDED, tone: "error", icon: CircleSlash },
  PENDING_VERIFICATION: { label: COURIER_STATUS_LABELS.PENDING_VERIFICATION, tone: "info", icon: ShieldCheck },
};

/* -------------------------------------------------------------------------- */
/*                                 Support                                    */
/* -------------------------------------------------------------------------- */

export const TICKET_STATUS_META: Record<TicketStatus, StatusMeta> = {
  OPEN: { label: TICKET_STATUS_LABELS.OPEN, tone: "info", icon: CircleDashed },
  IN_PROGRESS: { label: TICKET_STATUS_LABELS.IN_PROGRESS, tone: "primary", icon: Clock },
  WAITING: { label: TICKET_STATUS_LABELS.WAITING, tone: "warning", icon: Hourglass },
  RESOLVED: { label: TICKET_STATUS_LABELS.RESOLVED, tone: "success", icon: CheckCircle2 },
  CLOSED: { label: TICKET_STATUS_LABELS.CLOSED, tone: "neutral", icon: CircleSlash },
};

export const TICKET_PRIORITY_META: Record<TicketPriority, StatusMeta> = {
  LOW: { label: TICKET_PRIORITY_LABELS.LOW, tone: "neutral", icon: CircleDashed },
  MEDIUM: { label: TICKET_PRIORITY_LABELS.MEDIUM, tone: "info", icon: CircleDashed },
  HIGH: { label: TICKET_PRIORITY_LABELS.HIGH, tone: "warning", icon: AlertTriangle },
  URGENT: { label: TICKET_PRIORITY_LABELS.URGENT, tone: "error", icon: AlertTriangle },
};

/* -------------------------------------------------------------------------- */
/*                                Notification                                */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_META: Record<NotificationType, { label: string; tone: Tone; icon: LucideIcon }> = {
  ORDER_CONFIRMED: { label: NOTIFICATION_TYPE_LABELS.ORDER_CONFIRMED, tone: "info", icon: BadgeCheck },
  PAYMENT_SUCCESS: { label: NOTIFICATION_TYPE_LABELS.PAYMENT_SUCCESS, tone: "success", icon: CheckCircle2 },
  PAYMENT_FAILED: { label: NOTIFICATION_TYPE_LABELS.PAYMENT_FAILED, tone: "error", icon: XCircle },
  COURIER_ASSIGNED: { label: NOTIFICATION_TYPE_LABELS.COURIER_ASSIGNED, tone: "info", icon: UserCheck },
  COURIER_ACCEPTED: { label: NOTIFICATION_TYPE_LABELS.COURIER_ACCEPTED, tone: "info", icon: CheckCircle2 },
  COURIER_ARRIVING: { label: NOTIFICATION_TYPE_LABELS.COURIER_ARRIVING, tone: "secondary", icon: MapPin },
  PACKAGE_PICKED_UP: { label: NOTIFICATION_TYPE_LABELS.PACKAGE_PICKED_UP, tone: "secondary", icon: Package },
  COURIER_NEARBY: { label: NOTIFICATION_TYPE_LABELS.COURIER_NEARBY, tone: "primary", icon: MapPin },
  DELIVERY_COMPLETED: { label: NOTIFICATION_TYPE_LABELS.DELIVERY_COMPLETED, tone: "success", icon: PackageCheck },
  REFUND_COMPLETED: { label: NOTIFICATION_TYPE_LABELS.REFUND_COMPLETED, tone: "neutral", icon: RotateCcw },
  COUPON_APPLIED: { label: NOTIFICATION_TYPE_LABELS.COUPON_APPLIED, tone: "purple", icon: BadgeCheck },
  SUPPORT_REPLY: { label: NOTIFICATION_TYPE_LABELS.SUPPORT_REPLY, tone: "info", icon: CircleDashed },
  PROMOTION: { label: NOTIFICATION_TYPE_LABELS.PROMOTION, tone: "purple", icon: BadgeCheck },
  SYSTEM_ALERT: { label: NOTIFICATION_TYPE_LABELS.SYSTEM_ALERT, tone: "warning", icon: AlertTriangle },
};

/* -------------------------------------------------------------------------- */
/*                            Package / service / vehicle                     */
/* -------------------------------------------------------------------------- */

export const PACKAGE_TYPE_META: Record<PackageType, { label: string; icon: LucideIcon; hint: string }> = {
  DOCUMENT: { label: PACKAGE_TYPE_LABELS.DOCUMENT, icon: FileText, hint: "Letters, contracts, passports" },
  SMALL_PARCEL: { label: PACKAGE_TYPE_LABELS.SMALL_PARCEL, icon: Box, hint: "Shoes, accessories, gadgets" },
  MEDIUM_PARCEL: { label: PACKAGE_TYPE_LABELS.MEDIUM_PARCEL, icon: Package, hint: "Boxes up to 10 kg" },
  LARGE_PARCEL: { label: PACKAGE_TYPE_LABELS.LARGE_PARCEL, icon: Package, hint: "Bulky or heavy items" },
  FOOD: { label: PACKAGE_TYPE_LABELS.FOOD, icon: Box, hint: "Prepared food, groceries" },
  OTHER: { label: PACKAGE_TYPE_LABELS.OTHER, icon: Box, hint: "Anything else" },
};

export const SERVICE_META: Record<ServiceType, { label: string; icon: LucideIcon }> = {
  INSTANT: { label: SERVICE_LABELS.INSTANT, icon: Bike },
  SAME_DAY: { label: SERVICE_LABELS.SAME_DAY, icon: Truck },
  REGULAR: { label: SERVICE_LABELS.REGULAR, icon: Package },
  SCHEDULED: { label: SERVICE_LABELS.SCHEDULED, icon: CalendarClock },
};

export const VEHICLE_META: Record<VehicleType, { label: string; icon: LucideIcon }> = {
  BIKE: { label: VEHICLE_LABELS.BIKE, icon: Bike },
  THREE_WHEELER: { label: VEHICLE_LABELS.THREE_WHEELER, icon: Truck },
  CAR: { label: VEHICLE_LABELS.CAR, icon: Truck },
  VAN: { label: VEHICLE_LABELS.VAN, icon: Truck },
  WALK: { label: VEHICLE_LABELS.WALK, icon: UserCheck },
};

export {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SERVICE_LABELS,
  PACKAGE_TYPE_LABELS,
  VEHICLE_LABELS,
  COURIER_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  NOTIFICATION_TYPE_LABELS,
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

export function orderMeta(status?: OrderStatus | null): StatusMeta {
  if (!status) return { label: "Unknown", tone: "neutral", icon: CircleDashed };
  return ORDER_STATUS_META[status] ?? { label: status, tone: "neutral", icon: CircleDashed };
}

export function paymentMeta(status?: PaymentStatus | null): StatusMeta {
  if (!status) return { label: "Unknown", tone: "neutral", icon: CircleDashed };
  return PAYMENT_STATUS_META[status] ?? { label: status, tone: "neutral", icon: CircleDashed };
}

export function paymentMethodMeta(method?: PaymentMethod | null): StatusMeta {
  if (!method) return { label: "Unknown", tone: "neutral", icon: CreditCard };
  return PAYMENT_METHOD_META[method] ?? { label: method, tone: "neutral", icon: CreditCard };
}

export function courierMeta(status?: CourierStatus | null): StatusMeta {
  if (!status) return { label: "Unknown", tone: "neutral", icon: CircleDashed };
  return COURIER_STATUS_META[status] ?? { label: status, tone: "neutral", icon: CircleDashed };
}

export function ticketMeta(status?: TicketStatus | null): StatusMeta {
  if (!status) return { label: "Unknown", tone: "neutral", icon: CircleDashed };
  return TICKET_STATUS_META[status] ?? { label: status, tone: "neutral", icon: CircleDashed };
}

export function priorityMeta(priority?: TicketPriority | null): StatusMeta {
  if (!priority) return { label: "Medium", tone: "info", icon: CircleDashed };
  return TICKET_PRIORITY_META[priority] ?? { label: priority, tone: "neutral", icon: CircleDashed };
}

export function notificationMeta(type?: NotificationType | null) {
  if (!type) return { label: "Notification", tone: "neutral" as Tone, icon: CircleDashed };
  return NOTIFICATION_META[type] ?? { label: type, tone: "neutral" as Tone, icon: CircleDashed };
}

export function serviceMeta(type?: ServiceType | null) {
  if (!type) return { label: "Delivery", icon: Truck };
  return SERVICE_META[type] ?? { label: type, icon: Truck };
}

export function vehicleMeta(type?: VehicleType | null) {
  if (!type) return { label: "Vehicle", icon: Truck };
  return VEHICLE_META[type] ?? { label: type, icon: Truck };
}
