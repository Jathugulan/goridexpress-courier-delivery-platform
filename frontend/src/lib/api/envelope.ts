import type { ApiFailure, ApiSuccess, Pagination } from "@/types";

/** Shape returned by every GoRideXpress REST endpoint. */
export type ApiEnvelope<T> = ApiSuccess<T>;

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: { field: string; message: string }[];
  readonly payload?: T;

  constructor(opts: {
    message: string;
    status: number;
    code: string;
    fieldErrors?: { field: string; message: string }[];
    payload?: T;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.fieldErrors = opts.fieldErrors;
    this.payload = opts.payload;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isValidation() {
    return this.status === 422 || this.status === 400;
  }

  get isNetwork() {
    return this.status === 0;
  }

  /** Field-level error lookup for react-hook-form integration. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors?.find((e) => e.field === field)?.message;
  }
}

export const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export function normalizeFailure(status: number, body: unknown): ApiFailure {
  const fallback: ApiFailure = {
    success: false,
    message: status === 0 ? "Network error. Please check your connection." : "Something went wrong.",
    errorCode: status === 0 ? "NETWORK_ERROR" : `HTTP_${status}`,
  };
  if (body && typeof body === "object") return { ...fallback, ...(body as ApiFailure) };
  return fallback;
}

export function normalizeSuccess<T>(body: unknown, fallbackMessage: string): T {
  if (body && typeof body === "object" && "data" in (body as Record<string, unknown>)) {
    return (body as ApiSuccess<T>).data;
  }
  return body as T;
}
