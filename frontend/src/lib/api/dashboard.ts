import { api } from "./client";
import type { CustomerDashboard } from "@/types";

export const dashboardApi = {
  customer: () => api.get<CustomerDashboard>("/customers/dashboard"),
};

export const adminDashboardApi = {
  get: () => api.get<CustomerDashboard>("/admin/dashboard"),
};

export const healthApi = {
  check: () => api.get<{ application: string; mongodb: string; redis: string; uptime: number }>("/health"),
};
