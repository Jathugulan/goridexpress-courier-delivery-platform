import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentsList } from "@/components/customer/payments-list";

export const metadata: Metadata = {
  title: "Payments",
  description: "Every demo transaction, with downloadable receipts and simulated revenue stats.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every demo transaction, with downloadable receipts and simulated revenue stats."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Payments" }]}
        align="left"
      />
      <PaymentsList />
    </div>
  );
}
