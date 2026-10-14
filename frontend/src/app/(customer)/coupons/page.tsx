import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CouponsPanel } from "@/components/customer/coupons-panel";

export const metadata: Metadata = {
  title: "Coupons",
  description: "Promo codes you can apply at checkout.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Promo codes you can apply at checkout."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Coupons" }]}
        align="left"
      />
      <CouponsPanel />
    </div>
  );
}
