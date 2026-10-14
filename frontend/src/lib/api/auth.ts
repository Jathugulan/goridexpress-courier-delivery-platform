import { api } from "./client";
import type { AuthSession, Role, Session, User } from "@/types";

/* --------------------------------- Types ---------------------------------- */

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/* -------------------------------- Endpoints -------------------------------- */

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthSession>("/auth/register", payload, { skipErrorToast: true }),

  login: (payload: LoginPayload) =>
    api.post<AuthSession>("/auth/login", payload, { skipErrorToast: true }),

  logout: () => api.post<void>("/auth/logout"),

  refresh: () => api.post<AuthSession>("/auth/refresh", undefined, { skipAuthRefresh: true }),

  /**
   * No `skipAuthRefresh` here on purpose: a 401 means the access cookie
   * expired, and rotation can still recover the session silently. Skipping it
   * made every app load drop a signed-in user whose access token had lapsed.
   */
  me: () => api.get<AuthSession>("/auth/me"),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<void>("/auth/change-password", payload, { skipErrorToast: true }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }, { skipErrorToast: true }),

  resetPassword: (payload: { token: string; password: string; confirmPassword: string }) =>
    api.post<void>("/auth/reset-password", payload, { skipErrorToast: true }),

  sessions: () => api.get<Session[]>("/auth/sessions"),

  revokeSession: (sessionId: string) => api.delete<void>(`/auth/sessions/${sessionId}`),
  revokeAllSessions: () => api.post<void>("/auth/sessions/revoke-all"),
};

export function roleHome(role: Role | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "CUSTOMER") return "/customer/dashboard";
  return "/login";
}

export function fullName(user: Pick<User, "firstName" | "lastName"> | null | undefined) {
  if (!user) return "";
  return `${user.firstName} ${user.lastName}`.trim();
}

export function initials(user: Pick<User, "firstName" | "lastName"> | null | undefined) {
  if (!user) return "GR";
  return `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "GR";
}
