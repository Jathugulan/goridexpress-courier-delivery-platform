import type { PaginationMeta as PaginationMetaClass } from '../dto/pagination.dto';
import type { Role } from '../enums';

/** Authenticated principal attached to every request by `JwtStrategy`. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  sessionId?: string;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  sid?: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Mirrors `PriceBreakdown` in `frontend/src/types/index.ts`.
 * `priorityFee` covers the service-tier premium; `handlingFee` covers
 * fragile / special-handling / signature surcharges.
 */
export interface MoneyBreakdown {
  baseFee: number;
  distanceFee: number;
  distanceKm: number;
  serviceFee: number;
  insurance: number;
  priorityFee: number;
  handlingFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

/** Shape returned for every list endpoint. */
export type PaginationMeta = PaginationMetaClass;

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface RequestContext {
  ip?: string;
  userAgent?: string;
  userId?: string;
  role?: Role;
}

export interface DemoEnvelope {
  isDemo: true;
}
