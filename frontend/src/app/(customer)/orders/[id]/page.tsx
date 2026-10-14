import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { OrderDetail } from "@/components/customer/order-detail";

export const metadata: Metadata = {
  title: "Order details",
  description: "Full status history, route, courier and demo receipt for this delivery.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order details"
        crumbs={[
          { href: "/customer/dashboard", label: "Dashboard" },
          { href: "/customer/orders", label: "Orders" },
          { label: id },
        ]}
        align="left"
      />
      <OrderDetail orderId={id} />
    </div>
  );
}
