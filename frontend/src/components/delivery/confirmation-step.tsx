"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, MapPin, Package2, ReceiptIndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useDeliveryWizardStore } from "@/store/delivery-store";
import { formatCurrency } from "@/lib/format";
import { SERVICE_RATES } from "@/lib/pricing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/states";
import { DemoCardDisclosure } from "@/components/shared/pricing";

export function ConfirmationStep() {
  const router = useRouter();
  const orderRef = useDeliveryWizardStore((s) => s.orderRef);
  const deliveryId = useDeliveryWizardStore((s) => s.deliveryId);
  const paymentId = useDeliveryWizardStore((s) => s.paymentId);
  const transactionId = useDeliveryWizardStore((s) => s.transactionId);
  const draft = useDeliveryWizardStore((s) => s.draft);
  const reset = useDeliveryWizardStore((s) => s.reset);

  const service = SERVICE_RATES.find((s) => s.code === draft.serviceType) ?? SERVICE_RATES[0];

  const copy = (value: string | null, label: string) => {
    if (!value) return;
    void navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error("Could not copy to clipboard"));
  };

  const startNew = () => {
    reset();
    router.push("/customer/delivery/create");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 text-center">
      <div className="flex flex-col items-center">
        <span
          className="flex size-16 items-center justify-center rounded-2xl bg-success-light text-success dark:bg-success/15"
          aria-hidden="true"
        >
          <CheckCircle2 className="size-8" />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-ink">Delivery confirmed</h2>
        <p className="mt-1.5 text-sm text-ink-secondary">
          We are finding the closest courier for {service.name.toLowerCase()}. Live tracking unlocks
          as soon as the courier accepts the job.
        </p>
      </div>

      <Card padding="md" className="text-left">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailRow
            icon={<Package2 />}
            label="Order reference"
            value={orderRef ?? "—"}
            onCopy={orderRef ? () => copy(orderRef, "Order reference") : undefined}
          />
          <DetailRow
            icon={<ReceiptIndianRupee />}
            label="Demo transaction"
            value={transactionId ?? paymentId ?? "—"}
            onCopy={transactionId ? () => copy(transactionId, "Transaction ID") : undefined}
          />
          <DetailRow
            icon={<MapPin />}
            label="Pickup"
            value={draft.pickup ? `${draft.pickup.label} · ${draft.pickup.addressLine}` : "—"}
          />
          <DetailRow
            icon={<MapPin />}
            label="Dropoff"
            value={
              draft.destination
                ? `${draft.destination.label} · ${draft.destination.addressLine}`
                : "—"
            }
          />
        </dl>
      </Card>

      <DemoCardDisclosure />

      {draft.discount > 0 ? (
        <Alert tone="success" title={`You saved ${formatCurrency(draft.discount)} with ${draft.couponCode}`}>
          The discount was applied to this order only.
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        {deliveryId ? (
          <Button asChild size="lg">
            <Link href={`/customer/orders/${deliveryId}/tracking`}>Track this delivery</Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary" size="lg">
          <Link href="/customer/orders">View my orders</Link>
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={startNew}>
          Book another delivery
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        <span className="truncate text-sm font-semibold text-ink">{value}</span>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label={`Copy ${label.toLowerCase()}`}
          >
            <Copy className="size-3.5" />
          </button>
        ) : null}
      </dd>
    </div>
  );
}
