import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OrdersList } from "@/components/customer/orders-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PackagePlus } from "lucide-react";

export const metadata: Metadata = {
  title: "My orders",
  description: "Every GoRideXpress delivery you have booked, with live status and receipts.",
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My orders"
        description="Track progress, download receipts and reorder your usual deliveries."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Orders" }]}
        align="left"
        actions={
          <Button asChild>
            <a href="/customer/delivery/create">
              <PackagePlus className="size-4" aria-hidden="true" />
              New delivery
            </a>
          </Button>
        }
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
        <OrdersList />
      </Suspense>
    </div>
  );
}
