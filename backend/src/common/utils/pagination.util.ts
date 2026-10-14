import type { FilterQuery } from 'mongoose';
import { PaginationMeta, type PaginationQueryDto } from '../dto/pagination.dto';
import type { Paginated } from '../types';

/** Whitelisted sort fields per collection to prevent sort injection. */
export const SORTABLE_FIELDS: Record<string, string[]> = {
  orders: ['createdAt', 'updatedAt', 'orderNumber', 'totalAmount', 'status', 'etaMinutes'],
  payments: ['createdAt', 'paidAt', 'amount', 'status'],
  customers: ['createdAt', 'totalOrders', 'totalSpent', 'lastOrderAt', 'firstName', 'email'],
  couriers: ['createdAt', 'rating', 'completedDeliveries', 'name', 'status'],
  vehicles: ['createdAt', 'updatedAt', 'plateNumber', 'type'],
  deliveries: ['createdAt', 'updatedAt', 'distanceKm', 'status'],
  notifications: ['createdAt', 'readAt'],
  coupons: ['createdAt', 'code', 'usageCount', 'value', 'discountType', 'endDate'],
  promotions: ['createdAt', 'name', 'startDate', 'endDate'],
  support: ['createdAt', 'updatedAt', 'priority', 'status', 'subject'],
  reviews: ['createdAt', 'rating'],
  wallet: ['createdAt', 'amount', 'type'],
  auditLogs: ['createdAt', 'action', 'entity'],
};

const FIELD_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.]*$/;

/** Resolves `?sort=` into a safe Mongoose sort object. */
export function resolveSort(
  requested: string | undefined,
  collection: keyof typeof SORTABLE_FIELDS,
  fallback: Record<string, 1 | -1> = { createdAt: -1 },
): Record<string, 1 | -1> {
  if (!requested) return fallback;

  const direction: 1 | -1 = requested.startsWith('-') ? -1 : 1;
  const rawField = requested.replace(/^-/, '');
  if (!FIELD_PATTERN.test(rawField)) return fallback;

  const allowed = SORTABLE_FIELDS[collection] ?? [];
  const [root] = rawField.split('.');
  if (!allowed.includes(rawField) && !allowed.includes(root)) return fallback;

  return { [rawField]: direction };
}

/**
 * Builds the `$or` clause for a free-text `search` term across `fields`.
 * Uses a case-insensitive, non-regex-escaped pattern with a length cap to
 * avoid pathological queries.
 */
export function buildSearchFilter(
  search: string | undefined,
  fields: string[],
): FilterQuery<unknown> | undefined {
  if (!search) return undefined;
  const term = search.trim().slice(0, 120);
  if (!term) return undefined;
  const pattern = new RegExp(escapeRegExp(term), 'i');
  return { $or: fields.map((field) => ({ [field]: pattern })) };
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Runs a count + find pair and returns the canonical paginated shape. */
export function toPaginated<T>(items: T[], total: number, query: PaginationQueryDto): Paginated<T> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const pagination = new PaginationMeta({
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  });

  return { items, pagination };
}

/** Clamps a requested page to the last available page. */
export function clampPage(total: number, requested: number, limit: number): number {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return Math.min(Math.max(1, requested), totalPages);
}
