import { BadRequestException } from '@nestjs/common';
import type { GeoPoint } from '../types';
import { ErrorCode } from '../enums';

const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 28;

/** Validates latitude/longitude in range. Returns true when valid. */
export function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Throws a 400 when a coordinate pair is out of range. */
export function assertValidPoint(point: Partial<GeoPoint>, field = 'location'): GeoPoint {
  if (!isValidPoint(point)) {
    throw new BadRequestException({
      message: `Invalid ${field}: latitude must be -90..90 and longitude -180..180`,
      code: ErrorCode.VALIDATION_ERROR,
    });
  }
  return { latitude: point.latitude, longitude: point.longitude };
}

export function isValidPoint(point: Partial<GeoPoint> | undefined | null): point is GeoPoint {
  return !!point && isValidCoordinate(point.latitude, point.longitude);
}

export function assertValidPointStrict(
  point: Partial<GeoPoint> | undefined | null,
  field = 'location',
): GeoPoint {
  if (!isValidPoint(point)) {
    throw new BadRequestException({
      message: `Invalid ${field}: latitude must be -90..90 and longitude -180..180`,
      code: ErrorCode.VALIDATION_ERROR,
    });
  }
  return { latitude: point.latitude, longitude: point.longitude };
}

/** Haversine great-circle distance in kilometres. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Straight-line distance in km, rounded to 2dp. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  return round(haversineDistanceKm(a, b), 2);
}

/**
 * Road-distance estimate. Real routing belongs in a maps provider; the demo
 * uses a 1.3x detour factor plus per-minute urban buffer so ETAs are not
 * unrealistically optimistic.
 */
export function estimateRoadDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const straight = haversineDistanceKm(a, b);
  const detourFactor = 1.3;
  const bufferKm = 0.5;
  return round(Math.max(straight * detourFactor, straight + bufferKm), 2);
}

/** Duration estimate in minutes, clamped to a sane range. */
export function estimateDurationMinutes(distance: number, serviceMultiplier = 1): number {
  const raw = (distance / AVERAGE_SPEED_KMH) * 60 * serviceMultiplier;
  return clamp(Math.round(raw), 5, 480);
}

/** Straight-line bearing 0-360, used for map rotation. */
export function bearingBetween(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return round(((toDeg(Math.atan2(y, x)) + 360) % 360), 1);
}

/** Linear interpolation between two points, `t` in 0..1. */
export function interpolate(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  const ratio = clamp(t, 0, 1);
  return {
    latitude: round(a.latitude + (b.latitude - a.latitude) * ratio, 6),
    longitude: round(a.longitude + (b.longitude - a.longitude) * ratio, 6),
  };
}

/**
 * Builds a plausible GPS path between two points with a small lateral jitter,
 * so live-tracking maps show a realistic trail rather than a straight line.
 * Deterministic for a given `seed` so replays are stable.
 */
export function buildRoutePath(
  from: GeoPoint,
  to: GeoPoint,
  steps = 24,
  seed = 1,
): GeoPoint[] {
  const count = Math.max(2, steps);
  const path: GeoPoint[] = [];
  const jitter = 0.0006 * ((seed % 5) + 1) / 5;

  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const base = interpolate(from, to, t);
    const envelope = Math.sin(t * Math.PI);
    const offset = jitter * envelope * Math.sin(t * Math.PI * 2 * 3 + seed);
    path.push({
      latitude: round(base.latitude + offset, 6),
      longitude: round(base.longitude + offset * 0.8, 6),
    });
  }

  return path;
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
