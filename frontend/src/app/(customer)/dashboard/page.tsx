import type { Metadata } from "next";
import { CustomerDashboardView } from "@/components/customer/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your GoRideXpress dashboard: active deliveries, order history, wallet balance, coupons and recent payments.",
};

export default function CustomerDashboardPage() {
  return <CustomerDashboardView />;
}
