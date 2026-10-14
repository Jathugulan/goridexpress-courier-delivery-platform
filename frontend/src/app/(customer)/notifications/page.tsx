import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsPanel } from "@/components/customer/notifications-panel";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Delivery updates, payment receipts and offers in one place.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Delivery updates, payment receipts and offers in one place."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Notifications" }]}
        align="left"
      />
      <NotificationsPanel />
    </div>
  );
}
