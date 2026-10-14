/**
 * Presentation helpers: currency, dates, distances, durations, labels.
 * Kept free of React so they can be used in Server Components too.
 */

import { CURRENCY, DEMO_RECEIPT_NOTICE } from "@/constants/design";
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

/* -------------------------------------------------------------------------- */
/*                                  Currency                                  */
/* -------------------------------------------------------------------------- */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null | undefined, currency: string = CURRENCY.code): string {
  if (value === null || value === undefined || Number.isNaN(value)) return `${CURRENCY.symbol}0.00`;
  if (currency === CURRENCY.code) return currencyFormatter.format(value);
  return `${currency} ${value.toFixed(2)}`;
}

/** Compact currency for KPI cards: $12.4k */
export function formatCurrencyCompact(value: number | null | undefined): string {
  const n = value ?? 0;
  if (Math.abs(n) >= 1_000_000) return `${CURRENCY.symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${CURRENCY.symbol}${(n / 1_000).toFixed(1)}k`;
  return formatCurrency(n);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export function formatCompactNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0);
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  return `${(value ?? 0).toFixed(digits)}%`;
}

/* -------------------------------------------------------------------------- */
/*                                   Dates                                    */
/* -------------------------------------------------------------------------- */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFormatter.format(d);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return timeFormatter.format(d);
}

/** "2 minutes ago", "in 3 hours" */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (abs < minute) return "just now";
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diffMs / day), "day");
  if (abs < 30 * day) return rtf.format(Math.round(diffMs / week), "week");
  return rtf.format(Math.round(diffMs / (30 * day)), "month");
}

/** Machine-readable value for <time dateTime>. */
export function toDateTimeAttr(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function formatTimeWindow(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "—";
  return `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)}`;
}

/* -------------------------------------------------------------------------- */
/*                              Distance / duration                           */
/* -------------------------------------------------------------------------- */

export function formatDistance(km: number | null | undefined): string {
  const n = km ?? 0;
  if (n < 1) return `${Math.round(n * 1000)} m`;
  return `${n.toFixed(1)} km`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  const m = Math.max(0, Math.round(minutes ?? 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h} hr`;
  return `${h} hr ${rem} min`;
}

export function formatEta(minutes: number | null | undefined): string {
  const m = Math.max(0, Math.round(minutes ?? 0));
  if (m === 0) return "Arriving now";
  if (m < 60) return `${m} min`;
  return formatMinutes(m);
}

/* -------------------------------------------------------------------------- */
/*                                  Masking                                   */
/* -------------------------------------------------------------------------- */

/** Masks a card number for display: 4242 •••• •••• 4242 */
export function maskCardNumber(value?: string | null): string {
  if (!value) return "•••• •••• •••• ••••";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "•••• •••• •••• ••••";
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

export function maskPhone(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `••• ••• ${digits.slice(-4)}`;
}

/* -------------------------------------------------------------------------- */
/*                              Humanised labels                              */
/* -------------------------------------------------------------------------- */

export function humanize(value?: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function initialsFrom(name?: string | null, fallback = "GR"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/* -------------------------------------------------------------------------- */
/*                              Enum label maps                               */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Created",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_SUCCESS: "Payment Success",
  PAYMENT_FAILED: "Payment Failed",
  CONFIRMED: "Confirmed",
  COURIER_ASSIGNMENT: "Finding Courier",
  COURIER_ASSIGNED: "Courier Assigned",
  COURIER_ACCEPTED: "Courier Accepted",
  COURIER_ARRIVING: "Courier Arriving",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  NEAR_DESTINATION: "Near Destination",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  DELIVERY_FAILED: "Delivery Failed",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUND_PENDING: "Refund Pending",
  REFUNDED: "Refunded",
  PENDING_COD: "COD Pending",
  COD_COLLECTED: "COD Collected",
  COD_PENDING: "COD Pending",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  DUMMY_CARD: "Demo Card",
  DUMMY_WALLET: "Demo Wallet",
  CASH_ON_DELIVERY: "Cash on Delivery",
  DUMMY_MOBILE: "Demo Mobile Pay",
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  INSTANT: "Instant Delivery",
  SAME_DAY: "Same-Day Delivery",
  REGULAR: "Regular Delivery",
  SCHEDULED: "Scheduled Delivery",
};

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
  DOCUMENT: "Document",
  SMALL_PARCEL: "Small Parcel",
  MEDIUM_PARCEL: "Medium Parcel",
  LARGE_PARCEL: "Large Parcel",
  FOOD: "Food",
  OTHER: "Other",
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  BIKE: "Bike",
  THREE_WHEELER: "Three-Wheeler",
  CAR: "Car",
  VAN: "Van",
  WALK: "On Foot",
};

export const COURIER_STATUS_LABELS: Record<CourierStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  BUSY: "Busy",
  SUSPENDED: "Suspended",
  PENDING_VERIFICATION: "Pending Verification",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  ORDER_CONFIRMED: "Order confirmed",
  PAYMENT_SUCCESS: "Payment successful",
  PAYMENT_FAILED: "Payment failed",
  COURIER_ASSIGNED: "Courier assigned",
  COURIER_ACCEPTED: "Courier accepted",
  COURIER_ARRIVING: "Courier arriving",
  PACKAGE_PICKED_UP: "Package picked up",
  COURIER_NEARBY: "Courier nearby",
  DELIVERY_COMPLETED: "Delivery completed",
  REFUND_COMPLETED: "Refund completed",
  COUPON_APPLIED: "Coupon applied",
  SUPPORT_REPLY: "Support replied",
  PROMOTION: "Promotion",
  SYSTEM_ALERT: "System alert",
};

/* -------------------------------------------------------------------------- */
/*                              Address formatting                            */
/* -------------------------------------------------------------------------- */

export function formatAddressLine(
  address?: {
    addressLine?: string;
    city?: string;
    postalCode?: string;
  } | null,
): string {
  if (!address) return "—";
  return [address.addressLine, address.city, address.postalCode].filter(Boolean).join(", ") || "—";
}

export function shortAddress(address?: { addressLine?: string } | null): string {
  if (!address?.addressLine) return "—";
  const line = address.addressLine;
  return line.length > 42 ? `${line.slice(0, 41)}…` : line;
}

/* -------------------------------------------------------------------------- */
/*                                  Receipts                                  */
/* -------------------------------------------------------------------------- */

export interface ReceiptRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export function buildReceiptLines(input: {
  orderRef: string;
  transactionId: string;
  customerName: string;
  customerEmail: string;
  pickupLabel: string;
  deliveryLabel: string;
  serviceLabel: string;
  packageLabel: string;
  distanceKm: number;
  price: {
    baseFee: number;
    distanceFee: number;
    serviceFee: number;
    insurance: number;
    priorityFee?: number;
    handlingFee?: number;
    discount: number;
    tax: number;
    total: number;
  };
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  orderStatusLabel: string;
  orderDate: string;
  estimatedDelivery?: string | null;
  completedAt?: string | null;
}): ReceiptRow[] {
  const rows: ReceiptRow[] = [
    { label: "Order ID", value: input.orderRef },
    { label: "Transaction ID", value: input.transactionId },
    { label: "Customer", value: input.customerName },
    { label: "Email", value: input.customerEmail },
    { label: "Pickup Address", value: input.pickupLabel },
    { label: "Delivery Address", value: input.deliveryLabel },
    { label: "Delivery Service", value: input.serviceLabel },
    { label: "Package Type", value: input.packageLabel },
    { label: "Distance", value: formatDistance(input.distanceKm) },
  ];

  rows.push({ label: "Base Delivery Fee", value: formatCurrency(input.price.baseFee) });
  if (input.price.distanceFee > 0)
    rows.push({ label: "Distance Fee", value: formatCurrency(input.price.distanceFee) });
  if (input.price.handlingFee)
    rows.push({ label: "Handling Fee", value: formatCurrency(input.price.handlingFee) });
  if (input.price.priorityFee)
    rows.push({ label: "Priority Fee", value: formatCurrency(input.price.priorityFee) });
  rows.push({ label: "Insurance", value: formatCurrency(input.price.insurance) });
  rows.push({ label: "Service Fee", value: formatCurrency(input.price.serviceFee) });
  if (input.price.discount > 0)
    rows.push({ label: "Discount", value: `-${formatCurrency(input.price.discount)}` });
  rows.push({ label: "Tax", value: formatCurrency(input.price.tax) });
  rows.push({ label: "Total", value: formatCurrency(input.price.total), emphasis: true });

  rows.push({ label: "Payment Method", value: input.paymentMethodLabel });
  rows.push({ label: "Payment Status", value: input.paymentStatusLabel });
  rows.push({ label: "Order Status", value: input.orderStatusLabel });
  rows.push({ label: "Order Date", value: formatDateTime(input.orderDate) });
  rows.push({ label: "Estimated Delivery", value: formatDateTime(input.estimatedDelivery) });
  rows.push({ label: "Completed Date", value: formatDateTime(input.completedAt) });

  return rows;
}

export { DEMO_RECEIPT_NOTICE };

/* -------------------------------------------------------------------------- */
/*                             Textarea auto-resize                           */
/* -------------------------------------------------------------------------- */

export function autoGrowTextarea(el: HTMLTextAreaElement, max = 180) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, max)}px`;
}

/* -------------------------------------------------------------------------- */
/*                                    CSV                                     */
/* -------------------------------------------------------------------------- */

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: { key: keyof T; label: string }[]) {
  if (rows.length === 0) return "";
  const cols = columns ?? (Object.keys(rows[0]) as (keyof T)[]).map((key) => ({ key, label: String(key) }));
  const escape = (value: unknown) => {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => escape(c.label)).join(",");
  const body = rows.map((row) => cols.map((c) => escape(row[c.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columns?: { key: keyof T; label: string }[],
) {
  downloadTextFile(filename, toCsv(rows, columns), "text/csv;charset=utf-8");
}
