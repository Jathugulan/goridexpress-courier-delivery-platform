"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useDeliveryWizardStore } from "@/store/delivery-store";
import { useCreatePayment, useProcessPayment, useWallet } from "@/hooks/queries";
import { buildQuoteLocally } from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { errorMessage } from "@/hooks/queries";
import { dummyCardSchema, type DummyCardInputForm } from "@/schemas";
import type { PaymentMethod } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/input";
import { Alert } from "@/components/ui/states";
import { PriceSummary } from "@/components/shared/pricing";
import { cn } from "@/lib/utils";

const METHODS: {
  value: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof CreditCard;
  badge?: string;
}[] = [
  {
    value: "DUMMY_CARD",
    label: "Demo card",
    hint: "Use card 4242 4242 4242 4242",
    icon: CreditCard,
    badge: "Simulated",
  },
  {
    value: "DUMMY_WALLET",
    label: "Demo wallet",
    hint: "Pay from your simulated balance",
    icon: WalletIcon,
    badge: "Simulated",
  },
  {
    value: "CASH_ON_DELIVERY",
    label: "Cash on delivery",
    hint: "Pay the courier at the door",
    icon: Banknote,
  },
  {
    value: "DUMMY_MOBILE",
    label: "Demo mobile wallet",
    hint: "Simulated mobile payment prompt",
    icon: Smartphone,
    badge: "Simulated",
  },
];

export function PaymentStep() {
  const draft = useDeliveryWizardStore((s) => s.draft);
  const orderRef = useDeliveryWizardStore((s) => s.orderRef);
  const idempotencyKey = useDeliveryWizardStore((s) => s.idempotencyKey);
  const setPayment = useDeliveryWizardStore((s) => s.setPayment);
  const setStep = useDeliveryWizardStore((s) => s.setStep);
  const back = useDeliveryWizardStore((s) => s.back);

  const createPayment = useCreatePayment();
  const processPayment = useProcessPayment();
  const { data: wallet } = useWallet();

  const [method, setMethod] = React.useState<PaymentMethod>("DUMMY_CARD");
  const [stage, setStage] = React.useState<"idle" | "creating" | "processing">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DummyCardInputForm>({
    resolver: zodResolver(dummyCardSchema),
    defaultValues: { cardholderName: "", cardNumber: "", expiry: "", cvv: "" },
  });

  const quote = React.useMemo(
    () =>
      buildQuoteLocally({
        pickup: draft.pickup
          ? { latitude: draft.pickup.latitude, longitude: draft.pickup.longitude }
          : null,
        destination: draft.destination
          ? { latitude: draft.destination.latitude, longitude: draft.destination.longitude }
          : null,
        package: draft.package,
        serviceType: draft.serviceType,
        couponDiscount: draft.discount,
        scheduledFor: draft.scheduledFor,
      }),
    [draft],
  );

  const busy = stage !== "idle" || createPayment.isPending || processPayment.isPending;
  const needsCard = method === "DUMMY_CARD";
  const needsWallet = method === "DUMMY_WALLET";
  const walletShort =
    needsWallet && wallet ? (wallet.balance as number) < quote.total : false;

  const pay = (values: DummyCardInputForm) => {
    if (!orderRef) {
      toast.error("Your delivery was not created. Go back and try again.");
      return;
    }
    setStage("creating");

    createPayment.mutate(
      { orderId: orderRef, method },
      {
        onSuccess: (payment) => {
          setStage("processing");
          processPayment.mutate(
            {
              payload: {
                paymentId: payment.id,
                method,
                ...(needsCard ? { card: values } : {}),
                ...(needsWallet && wallet ? { walletId: wallet.id } : {}),
              },
              idempotencyKey: idempotencyKey ?? crypto.randomUUID(),
            },
            {
              onSuccess: (processed) => {
                setPayment({
                  paymentId: processed.id,
                  transactionId: processed.transactionId ?? null,
                });
                setStage("idle");
                setStep(6);
              },
              onError: (error) => {
                setStage("idle");
                toast.error("Payment failed", { description: errorMessage(error) });
              },
            },
          );
        },
        onError: (error) => {
          setStage("idle");
          toast.error("Could not start the payment", { description: errorMessage(error) });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(pay)} noValidate className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-ink">How would you like to pay?</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Every option below is simulated in this demo environment.
          </p>
          <div role="radiogroup" aria-label="Payment method" className="mt-3 grid gap-2 sm:grid-cols-2">
            {METHODS.map((option) => {
              const Icon = option.icon;
              return (
                <RadioCard
                  key={option.value}
                  name="payment-method"
                  value={option.value}
                  selected={method === option.value}
                  onChange={() => setMethod(option.value)}
                  icon={<Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />}
                  label={
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-ink">{option.label}</span>
                      {option.badge ? (
                        <span className="rounded-full bg-warning-light px-1.5 py-0.5 text-[10px] font-semibold text-warning dark:bg-warning/15">
                          {option.badge}
                        </span>
                      ) : null}
                    </span>
                  }
                  description={<span className="text-[11px] text-ink-muted">{option.hint}</span>}
                />
              );
            })}
          </div>
        </div>

        {needsCard ? (
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">Demo card details</p>
            </div>

            <Field required>
              <FieldLabel htmlFor="card-name" required>
                Cardholder name
              </FieldLabel>
              <Input
                id="card-name"
                autoComplete="off"
                placeholder="DEMO CUSTOMER"
                invalid={Boolean(errors.cardholderName)}
                {...register("cardholderName")}
              />
              <FieldError>{errors.cardholderName?.message}</FieldError>
            </Field>

            <Field required>
              <FieldLabel htmlFor="card-number" required>
                Card number
              </FieldLabel>
              <Input
                id="card-number"
                inputMode="numeric"
                autoComplete="off"
                placeholder="4242 4242 4242 4242"
                icon={<CreditCard />}
                invalid={Boolean(errors.cardNumber)}
                {...register("cardNumber")}
              />
              <FieldDescription>Any 16-digit number is accepted in the demo.</FieldDescription>
              <FieldError>{errors.cardNumber?.message}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field required>
                <FieldLabel htmlFor="card-expiry" required>
                  Expiry
                </FieldLabel>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  autoComplete="off"
                  invalid={Boolean(errors.expiry)}
                  {...register("expiry")}
                />
                <FieldError>{errors.expiry?.message}</FieldError>
              </Field>

              <Field required>
                <FieldLabel htmlFor="card-cvv" required>
                  CVV
                </FieldLabel>
                <Input
                  id="card-cvv"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="123"
                  maxLength={4}
                  icon={<Lock />}
                  invalid={Boolean(errors.cvv)}
                  {...register("cvv")}
                />
                <FieldDescription>Never stored — demo only.</FieldDescription>
                <FieldError>{errors.cvv?.message}</FieldError>
              </Field>
            </div>
          </Card>
        ) : null}

        {needsWallet ? (
          <Card padding="md">
            {walletShort ? (
              <Alert tone="warning" title="Not enough demo balance">
                Add demo money in your wallet, then retry this payment.
              </Alert>
            ) : (
              <div className="flex items-center gap-2 text-sm text-ink-secondary">
                <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                Demo balance {formatCurrency((wallet?.balance as number) ?? 0)} will cover{" "}
                {formatCurrency(quote.total)}.
              </div>
            )}
          </Card>
        ) : null}

        {method === "CASH_ON_DELIVERY" ? (
          <Card padding="md">
            <Alert tone="info" title="Pay at the door">
              Have the exact amount ready. The courier will confirm before handing over the parcel.
            </Alert>
          </Card>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="submit"
            size="lg"
            loading={busy}
            loadingText={stage === "creating" ? "Preparing payment…" : "Processing…"}
            disabled={walletShort}
            className="sm:min-w-48"
          >
            {!busy ? <Lock className="size-4" aria-hidden="true" /> : null}
            {method === "CASH_ON_DELIVERY" ? "Confirm order" : `Pay ${formatCurrency(quote.total)}`}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={back} disabled={busy}>
            Back
          </Button>
        </div>
      </div>

      <aside className="space-y-3">
        <PriceSummary price={quote} />
        <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[11px] text-ink-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            Payments are simulated end to end. No real card network, PSP, or bank is contacted, and
            no card data leaves your browser.
          </p>
        </div>
        {busy ? (
          <p className="flex items-center gap-2 text-xs text-ink-muted" aria-live="polite">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Do not close this page while the demo payment processes.
          </p>
        ) : null}
      </aside>
    </form>
  );
}
