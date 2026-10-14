import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LiveTracking } from "@/components/customer/live-tracking";

export const metadata: Metadata = {
  title: "Live tracking",
  description: "Follow your courier in real time with live map position, ETA and status updates.",
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live tracking"
        description="Positions update automatically while the courier is en route."
        crumbs={[
          { href: "/customer/dashboard", label: "Dashboard" },
          { href: "/customer/orders", label: "Orders" },
          { href: `/customer/orders/${id}`, label: "Order" },
          { label: "Tracking" },
        ]}
        align="left"
      />
      <LiveTracking deliveryId={id} />
    </div>
  );
}
