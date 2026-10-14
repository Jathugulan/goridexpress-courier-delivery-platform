"use client";

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "@/config";
import { ApiError, normalizeFailure } from "./envelope";
import type { ApiFieldError } from "@/types";

/** Extra per-request options understood by our wrapper. */
export interface RequestOptions extends Omit<AxiosRequestConfig, "baseURL" | "url" | "data" | "params"> {
  url: string;
  method?: AxiosRequestConfig["method"];
  params?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  /** Overrides the default success toast (mutations only). */
  successMessage?: string;
  /** Skip the global auth-refresh flow (used by the refresh endpoint itself). */
  skipAuthRefresh?: boolean;
  /** Skip global error toasting (the caller renders field-level errors). */
  skipErrorToast?: boolean;
  raw?: boolean;
}

const MUTATION = ["post", "put", "patch", "delete"] as const;

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Authentication is handled by HTTP-only cookies issued by the NestJS API.
  // Tokens are never read from or written to localStorage.
  withCredentials: true,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client": "goridexpress-web",
  },
});

/* -------------------------------------------------------------------------- */
/*                              Request interceptor                           */
/* -------------------------------------------------------------------------- */

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // `_grx` is populated by `request()` / `requestEnvelope()`. It exists so our
  // own options ride along on the axios config without colliding with axios's
  // own keys. Both interceptors read it, so it must be set on every request.
  const ctx = config as InternalAxiosRequestConfig & { _grx?: RequestOptions };
  if (ctx._grx?.successMessage) {
    config.headers.set("X-Success-Message", ctx._grx.successMessage);
  }
  return config;
});

/* -------------------------------------------------------------------------- */
/*                          Refresh-coordination helpers                       */
/* -------------------------------------------------------------------------- */

let refreshPromise: Promise<boolean> | null = null;
const unauthorizedListeners = new Set<(code: string) => void>();

/** Subscribe to global "session is gone" events (e.g. redirect to /login). */
export function onUnauthorized(listener: (code: string) => void) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

function announceUnauthorized(code: string) {
  unauthorizedListeners.forEach((l) => {
    try {
      l(code);
    } catch {
      /* noop */
    }
  });
}

async function attemptRefresh(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true, headers: { "Content-Type": "application/json" } },
      )
      .then((res) => {
        const body = res.data as { success?: boolean } | undefined;
        return body?.success !== false;
      })
      .catch(() => false)
      .finally(() => {
        // Allow a new refresh attempt on the next 401.
        window.setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

/* -------------------------------------------------------------------------- */
/*                     Endpoints where 401 is a valid answer                   */
/* -------------------------------------------------------------------------- */

/**
 * A 401 from these routes is the expected response, not an expired session:
 * they are the unauthenticated entry points of the auth flow. There is no
 * refresh token to rotate on them, so treating them like an ordinary 401 used
 * to cost a pointless `POST /auth/refresh` on every mistyped password, and it
 * queued the "invalid credentials" message behind that extra round-trip. It
 * would also have fired `announceUnauthorized`, i.e. signed out an already
 * authenticated user who opened /login in a second tab and fat-fingered the
 * password.
 *
 * The access token lives in an HTTP-only cookie the client cannot inspect, so
 * the browser cannot know in advance whether a session exists. On app load
 * that makes one `/auth/me` 401 for a signed-out visitor unavoidable, and this
 * repo does not attempt to hide it: browser network-log entries for a failed
 * request cannot be suppressed from script, so the only way to remove them
 * would be to stop making the request. What is avoidable is the request
 * *repeating* — see the `enabled` guard in `AuthBootstrap`.
 *
 * A 401 here therefore does cascade into `POST /auth/refresh`, which is
 * required for rotation to work: a signed-in user whose access token expired
 * while the refresh token is still valid must be re-authenticated silently on
 * load, and `useCurrentUser` calls `clear()` on the final failure, so
 * suppressing the refresh would sign them out on every app load.
 *
 * `/auth/me`, `/auth/logout`, `/auth/change-password` and `/auth/sessions` are
 * deliberately absent: those do require a session, so a 401 there is genuine
 * and must still trigger a refresh.
 */
const UNAUTHENTICATED_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
] as const;

function isExpectedAuthFailure(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0] ?? "";
  return UNAUTHENTICATED_ENDPOINTS.some((endpoint) => path.endsWith(endpoint));
}

/* -------------------------------------------------------------------------- */
/*                             Response interceptor                            */
/* -------------------------------------------------------------------------- */

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _grx?: RequestOptions; _retried?: boolean }) | undefined;
    const ctx = config?._grx;
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    const failure = normalizeFailure(status, body);

    /* --- Refresh-token rotation: one retry per request ------------------- */
    const expectedAuthFailure = isExpectedAuthFailure(config?.url);
    if (
      status === 401 &&
      config &&
      !config._retried &&
      !ctx?.skipAuthRefresh &&
      !expectedAuthFailure
    ) {
      config._retried = true;
      const refreshed = await attemptRefresh();
      if (refreshed) return http.request(config);
      announceUnauthorized(failure.errorCode);
    }

    const fieldErrors: ApiFieldError[] | undefined = Array.isArray(failure.errors)
      ? failure.errors
      : Array.isArray((body as { errors?: unknown[] })?.errors)
        ? ((body as { errors: ApiFieldError[] }).errors ?? []).map((e) => ({
            field: String((e as ApiFieldError)?.field ?? "_root"),
            message: String((e as ApiFieldError)?.message ?? "Invalid value"),
          }))
        : undefined;

    const apiError = new ApiError({
      message: failure.message,
      status,
      code: failure.errorCode,
      fieldErrors,
      payload: body as never,
    });

    if (status === 401 && !expectedAuthFailure) announceUnauthorized(failure.errorCode);

    return Promise.reject(apiError);
  },
);

/* -------------------------------------------------------------------------- */
/*                                Public helpers                              */
/* -------------------------------------------------------------------------- */

function isMutation(method: string | undefined) {
  return MUTATION.includes((method ?? "get").toLowerCase() as (typeof MUTATION)[number]);
}

/**
 * Perform an API call and return the unwrapped `data` field of the
 * `{ success, message, data }` envelope.
 */
export async function request<T>(config: RequestOptions): Promise<T> {
  const { body, params, ...rest } = config;
  const method = (rest.method ?? "get").toLowerCase();

  const response = await http.request<unknown>({
    ...rest,
    method,
    params: cleanParams(params),
    data: body,
    _grx: config,
  } as AxiosRequestConfig & { _grx: RequestOptions });

  if (config.raw) return response.data as T;
  const payload = response.data as { data?: T };
  return (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
}

/** Returns the full envelope (needed for pagination + messages). */
export async function requestEnvelope<T>(
  config: RequestOptions,
): Promise<{ data: T; message: string; pagination?: import("@/types").Pagination }> {
  const { body, params, ...rest } = config;
  const response = await http.request<{
    data: T;
    message?: string;
    pagination?: import("@/types").Pagination;
  }>({
    ...rest,
    data: body,
    params: cleanParams(params),
    _grx: config,
  } as AxiosRequestConfig & { _grx: RequestOptions });

  return {
    data: response.data?.data as T,
    message: response.data?.message ?? "",
    pagination: response.data?.pagination,
  };
}

function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      out[key] = value.join(",");
      return;
    }
    out[key] = String(value);
  });
  return out;
}

export type RequestInit = Omit<RequestOptions, "url" | "method" | "body">;

export const api = {
  get: <T>(url: string, options: RequestInit = {}) => request<T>({ ...options, url, method: "GET" }),
  post: <T>(url: string, body?: unknown, options: RequestInit = {}) =>
    request<T>({ ...options, url, method: "POST", body }),
  put: <T>(url: string, body?: unknown, options: RequestInit = {}) =>
    request<T>({ ...options, url, method: "PUT", body }),
  patch: <T>(url: string, body?: unknown, options: RequestInit = {}) =>
    request<T>({ ...options, url, method: "PATCH", body }),
  delete: <T>(url: string, options: RequestInit = {}) =>
    request<T>({ ...options, url, method: "DELETE" }),
};

export const isMutationRequest = isMutation;
export default http;
