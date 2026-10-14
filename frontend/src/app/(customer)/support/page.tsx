import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SupportPanel } from "@/components/customer/support-panel";

export const metadata: Metadata = {
  title: "Support",
  description: "Raise a ticket and follow the reply from our team.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Raise a ticket and follow the reply from our team."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Support" }]}
        align="left"
      />
      <SupportPanel />
    </div>
  );
}
