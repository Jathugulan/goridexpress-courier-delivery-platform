"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, PackageSearch, Search, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const quickTrackSchema = z.object({
  orderRef: z
    .string()
    .min(6, "Enter the full order ID")
    .max(24, "That order ID looks too long")
    .transform((v) => v.trim().toUpperCase()),
});

type QuickTrackInput = z.infer<typeof quickTrackSchema>;

/** Public, unauthenticated order lookup — sends the user to /track. */
export function QuickTrackWidget({ className }: { className?: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<QuickTrackInput>({
    resolver: zodResolver(quickTrackSchema),
    defaultValues: { orderRef: "" },
    mode: "onSubmit",
  });

  const onSubmit = (values: QuickTrackInput) => {
    if (!values.orderRef || values.orderRef.length < 6) {
      setError("orderRef", { message: "Enter the full order ID, e.g. GRX123456" });
      return;
    }
    router.push(`/track?ref=${encodeURIComponent(values.orderRef)}`);
  };

  return (
    <Card
      padding="lg"
      elevation="elevated"
      className={cn("w-full max-w-md border-primary/20 bg-card/95 backdrop-blur-md", className)}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
          aria-hidden="true"
        >
          <PackageSearch className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">Track your delivery</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
            Enter your order ID to see live courier location and status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <Field required>
          <FieldLabel htmlFor="quick-track-ref" required>
            Order ID
          </FieldLabel>
          <Input
            id="quick-track-ref"
            placeholder="GRX123456"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            icon={<Search />}
            invalid={Boolean(errors.orderRef)}
            aria-describedby={errors.orderRef ? "quick-track-ref-error" : undefined}
            {...register("orderRef")}
          />
          <FieldError id="quick-track-ref-error">{errors.orderRef?.message}</FieldError>
        </Field>

        <Button type="submit" size="block" rightIcon={<ArrowRight />}>
          Track order
        </Button>
      </form>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" aria-hidden="true" />
        No sign-in required. Tracking uses your order ID only.
      </p>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Demo banner                                */
/* -------------------------------------------------------------------------- */

export function HeroDemoNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-2 text-xs text-ink-muted", className)}>
      <Badge variant="warning" size="sm">
        Demo mode
      </Badge>
      No real payments — all transactions are simulated.
    </p>
  );
}
