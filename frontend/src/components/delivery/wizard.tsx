"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useDeliveryWizardStore, WIZARD_STEPS, type WizardStep } from "@/store/delivery-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/states";
import { AddressPicker } from "@/components/delivery/address-picker";
import { PackageStep } from "@/components/delivery/package-step";
import { ServiceStep } from "@/components/delivery/service-step";
import { ReviewStep } from "@/components/delivery/review-step";
import { PaymentStep } from "@/components/delivery/payment-step";
import { ConfirmationStep } from "@/components/delivery/confirmation-step";

export function DeliveryWizard() {
  const router = useRouter();
  const step = useDeliveryWizardStore((s) => s.step);
  const maxReached = useDeliveryWizardStore((s) => s.maxReached);
  const setStep = useDeliveryWizardStore((s) => s.setStep);
  const next = useDeliveryWizardStore((s) => s.next);
  const back = useDeliveryWizardStore((s) => s.back);
  const draft = useDeliveryWizardStore((s) => s.draft);
  const setPickup = useDeliveryWizardStore((s) => s.setPickup);
  const setDestination = useDeliveryWizardStore((s) => s.setDestination);
  const reset = useDeliveryWizardStore((s) => s.reset);

  const canContinue =
    step === 1 ? Boolean(draft.pickup?.id && draft.destination?.id) : true;
  const blockingReason =
    step === 1 && !canContinue
      ? "Choose a pickup and a dropoff address to continue."
      : null;

  const onNext = () => {
    if (!canContinue) return;
    next();
  };

  const leave = () => {
    router.push("/customer/dashboard");
  };

  return (
    <div className="space-y-6">
      <WizardStepper current={step} maxReached={maxReached} onSelect={setStep} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card padding="lg">
          <StepHeader
            step={step}
            title={WIZARD_STEPS.find((s) => s.step === step)?.title ?? "Delivery"}
            description={STEP_DESCRIPTIONS[step]}
          />

          <div className="mt-6">
            {step === 1 ? (
              <div className="space-y-6">
                <AddressPicker
                  role="pickup"
                  title="Pickup address"
                  description="Where should the courier collect your parcel?"
                  value={draft.pickup}
                  onChange={setPickup}
                />
                <AddressPicker
                  role="destination"
                  title="Dropoff address"
                  description="Where is the parcel going?"
                  value={draft.destination}
                  onChange={setDestination}
                />
              </div>
            ) : null}

            {step === 2 ? <PackageStep /> : null}
            {step === 3 ? <ServiceStep /> : null}
            {step === 4 ? <ReviewStep /> : null}
            {step === 5 ? <PaymentStep /> : null}
            {step === 6 ? <ConfirmationStep /> : null}
          </div>
        </Card>

        <aside className="space-y-3">
          {step < 6 ? (
            <Card padding="md" className="lg:sticky lg:top-24">
              <p className="text-sm font-semibold text-ink">Your booking</p>
              <p className="mt-1 text-xs text-ink-muted">
                Draft saves automatically in this browser session.
              </p>

              {blockingReason ? (
                <Alert tone="warning" className="mt-3" compact>
                  {blockingReason}
                </Alert>
              ) : null}

              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={onNext}
                  disabled={!canContinue || step >= 5}
                >
                  {step === 1 ? "Continue to package" : "Continue"}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>

                {step > 1 && step < 5 ? (
                  <Button type="button" variant="outline" className="w-full" onClick={back}>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Back
                  </Button>
                ) : null}

                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={leave}>
                  Save &amp; exit
                </Button>
              </div>

              <div className="mt-4 border-t border-line pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-error hover:bg-error-light"
                  onClick={() => {
                    reset();
                    setStep(1);
                  }}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Start over
                </Button>
              </div>
            </Card>
          ) : (
            <Card padding="md">
              <p className="text-xs text-ink-muted">
                Need help with this delivery?{" "}
                <Link href="/customer/support" className="font-semibold text-primary hover:underline">
                  Contact support
                </Link>
                .
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

const STEP_DESCRIPTIONS: Record<WizardStep, string> = {
  1: "Select or add the pickup and dropoff addresses for this delivery.",
  2: "Tell us what you are sending so we assign the right vehicle.",
  3: "Choose a delivery speed that matches your schedule.",
  4: "Check every detail before you pay.",
  5: "Pay with any simulated method — nothing here is real.",
  6: "Your courier is being assigned.",
};

function StepHeader({
  step,
  title,
  description,
}: {
  step: WizardStep;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Step {step} of 6
      </p>
      <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
    </div>
  );
}

function WizardStepper({
  current,
  maxReached,
  onSelect,
}: {
  current: WizardStep;
  maxReached: WizardStep;
  onSelect: (step: WizardStep) => void;
}) {
  return (
    <nav aria-label="Booking progress">
      <ol className="flex items-center gap-1 overflow-x-auto pb-1 sm:gap-2">
        {WIZARD_STEPS.map((item, index) => {
          const state =
            item.step === current ? "current" : item.step < current ? "done" : "todo";
          const reachable = item.step <= maxReached;

          return (
            <li key={item.step} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(item.step)}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "group flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1.5 text-left transition-colors sm:px-2",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  reachable ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    state === "done" && "bg-success text-white",
                    state === "current" && "bg-primary text-white",
                    state === "todo" && "bg-muted text-ink-muted",
                  )}
                  aria-hidden="true"
                >
                  {state === "done" ? <Check className="size-3.5" /> : item.step}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span
                    className={cn(
                      "block truncate text-xs font-semibold",
                      state === "current" ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {item.short}
                  </span>
                </span>
                <span className="sr-only">
                  Step {item.step}: {item.title}
                </span>
              </button>

              {index < WIZARD_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "h-0.5 min-w-3 flex-1 rounded-full transition-colors",
                    item.step < current ? "bg-success" : "bg-line",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
