/**
 * Runtime configuration.
 * Values are inlined at build time from NEXT_PUBLIC_* environment variables.
 */

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const RAW_SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export const API_BASE_URL = trimTrailingSlash(RAW_API_URL);
export const SOCKET_URL = trimTrailingSlash(RAW_SOCKET_URL);

export const SOCKET_PATH = "/socket.io";

/** OpenStreetMap raster tiles — no API key required. */
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const MAP_TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? "openstreetmap";

export const APP_NAME = "GoRideXpress";
export const APP_TAGLINE = "Fast. Safe. Reliable.";
export const APP_DESCRIPTION =
  "GoRideXpress is a smart real-time courier and delivery management platform for instant, same-day, scheduled, parcel, document, food and business deliveries.";

export const SUPPORT_EMAIL = "support@goridexpress.demo";
export const SUPPORT_PHONE = "+1 (555) 014-8890";

/** Cookie names set by the NestJS backend (HTTP-only, never read by JS). */
export const AUTH_COOKIE = {
  access: "grx_access_token",
  refresh: "grx_refresh_token",
} as const;
