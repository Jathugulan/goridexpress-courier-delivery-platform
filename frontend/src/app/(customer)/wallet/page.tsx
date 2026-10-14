import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { WalletPanel } from "@/components/customer/wallet-panel";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Your simulated balance, demo top-ups and full transaction history.",
};

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Your simulated balance, demo top-ups and full transaction history."
        crumbs={[{ href: "/customer/dashboard", label: "Dashboard" }, { label: "Wallet" }]}
        align="left"
      />
      <WalletPanel />
    </div>
  );
}
