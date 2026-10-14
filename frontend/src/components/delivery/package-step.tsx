"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Package2, Ruler, Thermometer, Weight } from "lucide-react";
import { useDeliveryWizardStore } from "@/store/delivery-store";
import { packageSchema, type PackageInput } from "@/schemas";
import type { PackageType } from "@/types";
import { Card } from "@/components/ui/card";
import { Checkbox, Input, Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/input";
import { Alert } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const PACKAGE_TYPES: { value: PackageType; label: string; hint: string }[] = [
  { value: "DOCUMENT", label: "Document", hint: "Envelopes, folders, contracts" },
  { value: "SMALL_PARCEL", label: "Small parcel", hint: "Shoes, accessories, gifts" },
  { value: "MEDIUM_PARCEL", label: "Medium parcel", hint: "Boxes up to 10 kg" },
  { value: "LARGE_PARCEL", label: "Large parcel", hint: "Bulky or heavy boxes" },
  { value: "FOOD", label: "Food & beverage", hint: "Prepared meals, groceries" },
  { value: "OTHER", label: "Something else", hint: "Anything not listed" },
];

const MAX_WEIGHT_BY_TYPE: Record<PackageType, number> = {
  DOCUMENT: 5,
  SMALL_PARCEL: 5,
  MEDIUM_PARCEL: 10,
  LARGE_PARCEL: 30,
  FOOD: 20,
  OTHER: 20,
};

export function PackageStep() {
  const draft = useDeliveryWizardStore((s) => s.draft);
  const patchPackage = useDeliveryWizardStore((s) => s.patchPackage);
  const [announce, setAnnounce] = React.useState("");

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PackageInput>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      type: draft.package.type,
      weight: draft.package.weight,
      length: draft.package.length,
      width: draft.package.width,
      height: draft.package.height,
      quantity: draft.package.quantity,
      isFragile: draft.package.isFragile,
      isTemperatureSensitive: draft.package.isTemperatureSensitive,
      requiresSpecialHandling: draft.package.requiresSpecialHandling,
      description: draft.package.description,
      specialInstructions: draft.package.specialInstructions,
    },
  });

  const values = watch();
  const type = (values.type ?? draft.package.type) as PackageType;
  const weight = Number(values.weight ?? 0);
  const quantity = Number(values.quantity ?? 1);
  const isFragile = Boolean(values.isFragile);
  const isTemp = Boolean(values.isTemperatureSensitive);
  const needsHandling = Boolean(values.requiresSpecialHandling);

  const maxWeight = MAX_WEIGHT_BY_TYPE[type] ?? 20;
  const overWeight = weight > maxWeight;

  const volume =
    (Number(values.length) || 0) * (Number(values.width) || 0) * (Number(values.height) || 0);
  const volumetricWeight = Math.round((volume / 5000) * 10) / 10;
  const chargeableWeight = Math.round(Math.max(weight, volumetricWeight) * quantity * 10) / 10;

  /* Keep the persisted draft in sync with the form. */
  React.useEffect(() => {
    patchPackage({
      type,
      weight,
      length: Number(values.length) || 0,
      width: Number(values.width) || 0,
      height: Number(values.height) || 0,
      quantity,
      isFragile,
      isTemperatureSensitive: isTemp,
      requiresSpecialHandling: needsHandling,
      description: values.description ?? "",
      specialInstructions: values.specialInstructions ?? "",
    });
  }, [
    type,
    weight,
    quantity,
    isFragile,
    isTemp,
    needsHandling,
    values.length,
    values.width,
    values.height,
    values.description,
    values.specialInstructions,
    patchPackage,
  ]);

  const handleType = (next: PackageType) => {
    setValue("type", next, { shouldValidate: true, shouldDirty: true });
    setAnnounce(`${PACKAGE_TYPES.find((t) => t.value === next)?.label ?? next} selected`);
  };

  return (
    <form className="space-y-5" noValidate>
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">What are you sending?</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Choose the closest match so the courier brings the right vehicle.
        </p>
        <div
          role="radiogroup"
          aria-label="Package type"
          className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {PACKAGE_TYPES.map((option) => {
            const active = option.value === type;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleType(option.value)}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none",
                  active
                    ? "border-primary bg-primary-light/50 shadow-card dark:bg-primary/10"
                    : "border-line bg-card hover:border-primary/40 hover:shadow-card",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-card text-primary" : "bg-muted text-ink-secondary",
                  )}
                  aria-hidden="true"
                >
                  <Package2 className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] text-ink-muted">{option.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {errors.type ? <FieldError>{errors.type.message}</FieldError> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field required>
          <FieldLabel htmlFor="package-weight" required>
            Weight
          </FieldLabel>
          <Input
            id="package-weight"
            type="number"
            step="0.1"
            min="0.1"
            max={maxWeight}
            icon={<Weight />}
            suffix="kg"
            invalid={Boolean(errors.weight) || overWeight}
            {...register("weight")}
          />
          {overWeight ? (
            <FieldError>Max {maxWeight} kg for this parcel type.</FieldError>
          ) : (
            <FieldDescription>Up to {maxWeight} kg.</FieldDescription>
          )}
        </Field>

        <Field required>
          <FieldLabel htmlFor="package-length" required>
            Length
          </FieldLabel>
          <Input
            id="package-length"
            type="number"
            min="1"
            icon={<Ruler />}
            suffix="cm"
            invalid={Boolean(errors.length)}
            {...register("length")}
          />
          <FieldError>{errors.length?.message}</FieldError>
        </Field>

        <Field required>
          <FieldLabel htmlFor="package-width" required>
            Width
          </FieldLabel>
          <Input
            id="package-width"
            type="number"
            min="1"
            icon={<Ruler />}
            suffix="cm"
            invalid={Boolean(errors.width)}
            {...register("width")}
          />
          <FieldError>{errors.width?.message}</FieldError>
        </Field>

        <Field required>
          <FieldLabel htmlFor="package-height" required>
            Height
          </FieldLabel>
          <Input
            id="package-height"
            type="number"
            min="1"
            icon={<Ruler />}
            suffix="cm"
            invalid={Boolean(errors.height)}
            {...register("height")}
          />
          <FieldError>{errors.height?.message}</FieldError>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field required>
          <FieldLabel htmlFor="package-quantity" required>
            Quantity
          </FieldLabel>
          <Input
            id="package-quantity"
            type="number"
            min="1"
            max="50"
            icon={<Package2 />}
            suffix="items"
            invalid={Boolean(errors.quantity)}
            {...register("quantity")}
          />
          <FieldError>{errors.quantity?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="package-description">Description</FieldLabel>
          <Input
            id="package-description"
            placeholder="e.g. Blue birthday gift box"
            invalid={Boolean(errors.description)}
            {...register("description")}
          />
          <FieldError>{errors.description?.message}</FieldError>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Handling requirements</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <HandlingToggle
            id="package-fragile"
            checked={isFragile}
            onChange={(v) => setValue("isFragile", v, { shouldDirty: true })}
            title="Fragile"
            hint="Careful placement"
          />
          <HandlingToggle
            id="package-temperature"
            checked={isTemp}
            onChange={(v) => setValue("isTemperatureSensitive", v, { shouldDirty: true })}
            title="Temperature sensitive"
            hint="Insulated handling"
          />
          <HandlingToggle
            id="package-handling"
            checked={needsHandling}
            onChange={(v) => setValue("requiresSpecialHandling", v, { shouldDirty: true })}
            title="Special handling"
            hint="Two-person carry"
          />
        </div>
      </fieldset>

      {isFragile || isTemp || needsHandling ? (
        <Field>
          <FieldLabel htmlFor="package-special">Special handling notes</FieldLabel>
          <Input
            id="package-special"
            placeholder="e.g. Keep upright, do not stack, deliver before noon"
            invalid={Boolean(errors.specialInstructions)}
            {...register("specialInstructions")}
          />
          <FieldError>{errors.specialInstructions?.message}</FieldError>
        </Field>
      ) : null}

      <Card padding="sm" className="bg-muted/50">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="text-xs text-ink-secondary">
            <p className="font-semibold text-ink">Estimated chargeable weight: {chargeableWeight} kg</p>
            <p className="mt-0.5">
              Actual {weight || 0} kg vs volumetric {volumetricWeight} kg (length × width × height ÷
              5000). The greater value is billed across {quantity} item(s).
            </p>
          </div>
        </div>
      </Card>

      {isFragile || isTemp ? (
        <Alert tone="warning" title="Special handling may add a fee" icon={Thermometer}>
          Handling requirements are quoted at checkout before you pay.
        </Alert>
      ) : null}
    </form>
  );
}

function HandlingToggle({
  id,
  checked,
  onChange,
  title,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all",
        checked ? "border-primary bg-primary-light/50 dark:bg-primary/10" : "border-line bg-card hover:border-primary/50",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-[11px] text-ink-muted">{hint}</span>
      </span>
    </label>
  );
}
