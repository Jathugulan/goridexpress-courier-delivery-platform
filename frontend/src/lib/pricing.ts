/**
 * Client-side price *preview* only.
 * The NestJS backend always recalculates the authoritative total during
 * delivery creation and payment processing (SRS § Price Calculation).
 */

import type { PackageDetails, PriceBreakdown, ServiceType } from "@/types";

export interface ServiceRate {
  code: ServiceType;
  name: string;
  description: string;
  basePrice: number;
  pricePerKm: number;
  estimatedMinutes: number;
  vehicleType: "BIKE" | "THREE_WHEELER" | "CAR" | "VAN" | "WALK";
  accent: "primary" | "secondary" | "success" | "warning";
  popular?: boolean;
}

/** Delivery service catalogue (mirrors DeliveryService collection). */
export const SERVICE_RATES: ServiceRate[] = [
  {
    code: "INSTANT",
    name: "Instant Delivery",
    description: "On-demand pickup and doorstep delivery in about 60 minutes.",
    basePrice: 2.9,
    pricePerKm: 0.85,
    estimatedMinutes: 60,
    vehicleType: "BIKE",
    accent: "primary",
    popular: true,
  },
  {
    code: "SAME_DAY",
    name: "Same-Day Delivery",
    description: "Guaranteed arrival before 8:00 PM on the same day.",
    basePrice: 2.4,
    pricePerKm: 0.7,
    estimatedMinutes: 240,
    vehicleType: "BIKE",
    accent: "secondary",
  },
  {
    code: "REGULAR",
    name: "Regular Delivery",
    description: "Standard next-business-day service at the best rate.",
    basePrice: 1.9,
    pricePerKm: 0.55,
    estimatedMinutes: 1440,
    vehicleType: "THREE_WHEELER",
    accent: "success",
  },
  {
    code: "SCHEDULED",
    name: "Scheduled Delivery",
    description: "Pick a precise time slot that suits your schedule.",
    basePrice: 2.1,
    pricePerKm: 0.6,
    estimatedMinutes: 180,
    vehicleType: "VAN",
    accent: "warning",
  },
];

export const TAX_RATE = 0;
export const INSURANCE_RATE_PER_KG = 0.12;
export const HANDLING_FEE_FRAGILE = 0.75;
export const PRIORITY_FEE = 1.25;
export const SERVICE_FEE = 0.5;
export const MAX_WEIGHT_KG = 30;
export const MIN_WEIGHT_KG = 0.1;

/** Volumetric weight in kg — used to price bulky light parcels fairly. */
export function volumetricWeight(pkg: PackageDetails): number {
  const { length, width, height, quantity } = pkg;
  const divisor = 5000;
  return (length * width * height * quantity) / divisor;
}

export function billableWeight(pkg: PackageDetails): number {
  return Math.max(pkg.weight, volumetricWeight(pkg));
}

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface LocalQuote {
  distanceKm: number;
  durationMinutes: number;
  baseFee: number;
  distanceFee: number;
  serviceFee: number;
  insurance: number;
  priorityFee: number;
  handlingFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  estimatedPickup: string;
  estimatedDelivery: string;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function buildQuoteLocally(input: {
  pickup: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  package: PackageDetails;
  serviceType: ServiceType;
  couponDiscount?: number;
  scheduledFor?: string | null;
}): LocalQuote {
  const service =
    SERVICE_RATES.find((s) => s.code === input.serviceType) ?? SERVICE_RATES[0];

  const distanceKm =
    input.pickup && input.destination
      ? round(haversineKm(input.pickup, input.destination) * 1.28) // road-factor approximation
      : 0;

  const weight = billableWeight(input.package);
  const baseFee = service.basePrice;
  const distanceFee = round(distanceKm * service.pricePerKm);
  const weightFee = round(weight * 0.18);
  const serviceFee = SERVICE_FEE;
  const insurance = round(Math.max(weight, 0.1) * INSURANCE_RATE_PER_KG);
  const priorityFee = input.serviceType === "INSTANT" ? PRIORITY_FEE : 0;
  const handlingFee = input.package.isFragile ? HANDLING_FEE_FRAGILE : 0;

  const gross = baseFee + distanceFee + weightFee + serviceFee + insurance + priorityFee + handlingFee;
  const discount = round(Math.min(input.couponDiscount ?? 0, gross));
  const taxable = Math.max(0, gross - discount);
  const tax = round(taxable * TAX_RATE);
  const total = round(taxable + tax);

  // Road distance at ~24 km/h city average
  const durationMinutes = Math.max(
    service.estimatedMinutes > 600 ? 1440 : 18,
    Math.round((distanceKm / 24) * 60) + 12,
  );

  const now = new Date();
  const estimatedPickup = new Date(now.getTime() + 15 * 60_000);
  const scheduled = input.scheduledFor ? new Date(input.scheduledFor) : null;
  const estimatedDelivery =
    scheduled && !Number.isNaN(scheduled.getTime())
      ? scheduled
      : new Date(now.getTime() + durationMinutes * 60_000);

  return {
    distanceKm,
    durationMinutes,
    baseFee,
    distanceFee,
    serviceFee,
    insurance,
    priorityFee,
    handlingFee,
    discount,
    tax,
    total,
    currency: "USD",
    estimatedPickup: estimatedPickup.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
  };
}

export function priceToBreakdown(quote: LocalQuote): PriceBreakdown {
  return {
    baseFee: quote.baseFee,
    distanceFee: quote.distanceFee,
    distanceKm: quote.distanceKm,
    serviceFee: quote.serviceFee,
    insurance: quote.insurance,
    priorityFee: quote.priorityFee,
    handlingFee: quote.handlingFee,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    currency: quote.currency,
  };
}

/** Package type multipliers that influence weight-based fees. */
export const PACKAGE_TYPE_FACTOR: Record<string, number> = {
  DOCUMENT: 0.6,
  SMALL_PARCEL: 1,
  MEDIUM_PARCEL: 1.25,
  LARGE_PARCEL: 1.6,
  FOOD: 1.1,
  OTHER: 1,
};

/** Badges derived from package attributes (SRS § Package Intelligence). */
export function packageBadges(pkg: PackageDetails): { label: string; tone: "warning" | "info" | "error" | "primary" }[] {
  const badges: { label: string; tone: "warning" | "info" | "error" | "primary" }[] = [];
  if (pkg.isFragile) badges.push({ label: "Fragile", tone: "warning" });
  if (pkg.weight >= 15) badges.push({ label: "Heavy", tone: "error" });
  if (pkg.isTemperatureSensitive) badges.push({ label: "Temperature Sensitive", tone: "info" });
  if (pkg.requiresSpecialHandling) badges.push({ label: "Special Handling", tone: "info" });
  if (pkg.type === "DOCUMENT") badges.push({ label: "Priority Docs", tone: "primary" });
  return badges;
}
