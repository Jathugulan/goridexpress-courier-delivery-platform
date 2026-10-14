import { BadRequestException } from '@nestjs/common';
import { DiscountType, ErrorCode, ServiceType } from '../enums';
import type { MoneyBreakdown } from '../types';
import { estimateDurationMinutes, round } from './geo.util';

export const DEFAULT_TAX_RATE = 0.05;
export const DEFAULT_INSURANCE_RATE = 0.01;

/** Per-tier pricing. `priorityFee` is the premium over the REGULAR base. */
export const SERVICE_PRICING: Record<
  ServiceType,
  {
    baseFee: number;
    perKm: number;
    priorityFee: number;
    durationMultiplier: number;
    label: string;
  }
> = {
  [ServiceType.INSTANT]: { baseFee: 2, perKm: 0.9, priorityFee: 3, durationMultiplier: 0.9, label: 'Instant' },
  [ServiceType.SAME_DAY]: { baseFee: 2, perKm: 0.9, priorityFee: 1.5, durationMultiplier: 1, label: 'Same Day' },
  [ServiceType.REGULAR]: { baseFee: 2, perKm: 0.9, priorityFee: 0, durationMultiplier: 1.1, label: 'Regular' },
  [ServiceType.SCHEDULED]: { baseFee: 2, perKm: 0.9, priorityFee: -0.5, durationMultiplier: 1.2, label: 'Scheduled' },
};

/** Multiplier applied to the base + distance fee based on parcel size. */
export const PACKAGE_MULTIPLIERS: Record<string, number> = {
  DOCUMENT: 0.8,
  SMALL_PARCEL: 1,
  MEDIUM_PARCEL: 1.35,
  LARGE_PARCEL: 1.8,
  FOOD: 1.1,
  OTHER: 1,
};

/** Flat surcharges for special handling. */
export const HANDLING_FEES = {
  FRAGILE: 1.5,
  SIGNATURE: 0.75,
  TEMPERATURE_SENSITIVE: 2,
  SPECIAL_HANDLING: 1.25,
} as const;

export const INCLUDED_WEIGHT_KG = 5;
export const EXTRA_KG_RATE = 0.35;

export interface PriceInput {
  distanceKm: number;
  serviceType: ServiceType;
  packageType: string;
  weight?: number;
  insuranceValue?: number;
  isFragile?: boolean;
  isTemperatureSensitive?: boolean;
  requiresSpecialHandling?: boolean;
  hasSignatureRequired?: boolean;
  discount?: { type: DiscountType; value: number; maximumDiscount?: number | null };
  taxRate?: number;
  insuranceRate?: number;
}

export interface PriceResult extends MoneyBreakdown {
  durationMinutes: number;
  lineItems: { label: string; amount: number }[];
}

export function calculatePrice(input: PriceInput): PriceResult {
  const distance = Math.max(0.1, input.distanceKm ?? 0);
  const pricing = SERVICE_PRICING[input.serviceType] ?? SERVICE_PRICING[ServiceType.REGULAR];
  const packageMultiplier = PACKAGE_MULTIPLIERS[input.packageType] ?? 1;

  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const insuranceRate = input.insuranceRate ?? DEFAULT_INSURANCE_RATE;

  const baseFee = round(pricing.baseFee * packageMultiplier);
  const priorityFee = round(pricing.priorityFee * packageMultiplier);

  // Distance fee tapers after 15 km so long hauls stay proportionate.
  const taper = distance <= 15 ? 1 : 1 - Math.min(0.35, (distance - 15) * 0.008);
  const distanceFee = round(pricing.perKm * distance * taper * packageMultiplier);

  const weight = Math.max(0, input.weight ?? 0);
  const serviceFee =
    weight > INCLUDED_WEIGHT_KG ? round((weight - INCLUDED_WEIGHT_KG) * EXTRA_KG_RATE) : 0;

  let handlingFee = 0;
  if (input.isFragile) handlingFee += HANDLING_FEES.FRAGILE;
  if (input.isTemperatureSensitive) handlingFee += HANDLING_FEES.TEMPERATURE_SENSITIVE;
  if (input.requiresSpecialHandling) handlingFee += HANDLING_FEES.SPECIAL_HANDLING;
  if (input.hasSignatureRequired) handlingFee += HANDLING_FEES.SIGNATURE;
  handlingFee = round(handlingFee);

  const insurance =
    input.insuranceValue && input.insuranceValue > 0
      ? round(input.insuranceValue * insuranceRate)
      : 0;

  const subtotal = round(baseFee + priorityFee + distanceFee + serviceFee + handlingFee + insurance);
  const tax = round(subtotal * taxRate);

  const grossTotal = round(subtotal + tax);
  const discount = resolveDiscount(input.discount, grossTotal);
  const total = round(Math.max(0, grossTotal - discount));

  const lineItems = [
    { label: `${pricing.label} base fee`, amount: baseFee },
    { label: 'Priority fee', amount: priorityFee },
    { label: 'Distance fee', amount: distanceFee },
    ...(serviceFee > 0 ? [{ label: 'Weight surcharge', amount: serviceFee }] : []),
    ...(handlingFee > 0 ? [{ label: 'Special handling', amount: handlingFee }] : []),
    ...(insurance > 0 ? [{ label: 'Parcel insurance', amount: insurance }] : []),
    ...(discount > 0 ? [{ label: 'Discount', amount: -discount }] : []),
    { label: 'Tax', amount: tax },
  ];

  return {
    baseFee,
    distanceFee,
    distanceKm: round(distance),
    serviceFee,
    insurance,
    priorityFee,
    handlingFee,
    discount,
    tax,
    total,
    currency: 'USD',
    durationMinutes: estimateDurationMinutes(distance, pricing.durationMultiplier),
    lineItems,
  };
}

/** Resolves a coupon into a discount amount, clamped by `maximumDiscount`. */
export function resolveDiscount(
  discount: { type: DiscountType; value: number; maximumDiscount?: number | null } | undefined,
  grossTotal: number,
): number {
  if (!discount) return 0;

  let amount = 0;
  switch (discount.type) {
    case DiscountType.FREE_DELIVERY:
      amount = grossTotal;
      break;
    case DiscountType.PERCENTAGE:
      amount = (grossTotal * Math.min(Math.max(discount.value, 0), 100)) / 100;
      break;
    case DiscountType.FIXED_AMOUNT:
      amount = Math.min(Math.max(discount.value, 0), grossTotal);
      break;
    default:
      amount = 0;
  }

  const cap = discount.maximumDiscount;
  if (cap != null && cap > 0) amount = Math.min(amount, cap);

  return round(Math.max(0, Math.min(amount, grossTotal)));
}

/** Rounds to cents and asserts a non-negative, finite amount. */
export function assertValidAmount(amount: unknown, field = 'amount'): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException({
      message: `${field} must be a non-negative number`,
      code: ErrorCode.VALIDATION_ERROR,
    });
  }
  return round(amount);
}
