import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfilePanel } from "@/components/customer/profile-panel";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your personal details, address book and account security.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal details, address book and account security."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Profile" }]}
        align="left"
      />
      <ProfilePanel />
    </div>
  );
}
