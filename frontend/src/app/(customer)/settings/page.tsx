import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsPanel } from "@/components/customer/settings-panel";

export const metadata: Metadata = {
  title: "Settings",
  description: "Appearance, session and local data preferences.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Appearance, session and local data preferences."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Settings" }]}
        align="left"
      />
      <SettingsPanel />
    </div>
  );
}
