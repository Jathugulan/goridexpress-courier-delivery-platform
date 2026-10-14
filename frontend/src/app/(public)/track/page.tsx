import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicTracker } from "@/components/tracking/public-tracker";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Track your delivery",
  description:
    "Follow a GoRideXpress delivery live with your order ID — no sign-in required. See courier location, status timeline and estimated arrival.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live tracking"
        title="Where is my parcel right now?"
        description="Enter the order ID from your confirmation message to see live courier location, the current status and the estimated arrival time."
        crumbs={[{ label: "Home", href: "/" }, { label: "Track" }]}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <PublicTracker />
        </Suspense>
      </div>
    </>
  );
}
