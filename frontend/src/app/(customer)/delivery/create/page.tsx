import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DeliveryWizard } from "@/components/delivery/wizard";

export const metadata: Metadata = {
  title: "Book a delivery",
  description:
    "Book a GoRideXpress delivery in six steps: addresses, package, service, review, demo payment and confirmation.",
};

export default function CreateDeliveryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Book a delivery"
        description="Six quick steps. Nothing is charged — all payments are simulated."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Book a delivery" }]}
      />
      <DeliveryWizard />
    </div>
  );
}
