"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Check,
  Home,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useAddressMutations, useAddresses } from "@/hooks/queries";
import { addressSchema, type AddressInput } from "@/schemas";
import type { Address } from "@/types";
import type { DraftAddress } from "@/store/delivery-store";
import { Button } from "@/components/ui/button";
import { Input, Field, FieldError, FieldLabel } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";

const LABEL_ICONS: Record<string, typeof Home> = {
  Home: Home,
  Work: Building2,
  Office: Building2,
  Other: MapPin,
};

function toDraft(address: Address): DraftAddress {
  return {
    id: address.id,
    label: address.label,
    recipientName: address.recipientName,
    contactNumber: address.contactNumber,
    addressLine: address.addressLine,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    latitude: address.latitude,
    longitude: address.longitude,
    deliveryInstructions: address.deliveryInstructions,
  };
}

export function AddressPicker({
  role,
  value,
  onChange,
  title,
  description,
  className,
}: {
  role: "pickup" | "destination";
  value: DraftAddress | null;
  onChange: (address: DraftAddress | null) => void;
  title: string;
  description: string;
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { data, isPending, isError } = useAddresses();
  const { remove } = useAddressMutations();
  const addresses = React.useMemo(() => data?.items ?? [], [data]);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return addresses;
    return addresses.filter((address) =>
      [address.label, address.addressLine, address.city, address.recipientName]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    );
  }, [addresses, query]);

  const Icon = LABEL_ICONS[value?.label ?? "Other"] ?? MapPin;

  return (
    <section className={cn("space-y-3", className)} aria-labelledby={`${role}-heading`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`${role}-heading`} className="text-sm font-semibold text-ink">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus aria-hidden="true" />
          Add new
        </Button>
      </div>

      {value ? (
        <Card padding="md" className="border-primary/30 bg-primary-light/30 dark:bg-primary/10">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm"
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-ink">{value.label}</p>
                {value.recipientName ? (
                  <span className="text-xs text-ink-muted">for {value.recipientName}</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-ink-secondary">{value.addressLine}</p>
              <p className="text-xs text-ink-muted">
                {value.city}
                {value.postalCode ? ` · ${value.postalCode}` : ""}
                {value.province ? ` · ${value.province}` : ""}
              </p>
              {value.deliveryInstructions ? (
                <p className="mt-1.5 text-xs italic text-ink-muted">
                  “{value.deliveryInstructions}”
                </p>
              ) : null}
            </div>
            <Badge variant="success" size="sm" className="shrink-0">
              <Check className="size-3" aria-hidden="true" />
              Selected
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-primary/20 pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
              Change
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Clear
            </Button>
          </div>
        </Card>
      ) : null}

      <div>
        <div className="relative">
          <label htmlFor={`${role}-search`} className="sr-only">
            Search saved addresses
          </label>
          <Input
            id={`${role}-search`}
            type="search"
            placeholder="Search saved addresses…"
            icon={<Search />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {isPending ? (
          <ul className="mt-3 space-y-2" aria-busy="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-20 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <Card padding="md" className="mt-3 text-sm text-error">
            Could not load your saved addresses. The demo API is offline.
          </Card>
        ) : filtered.length === 0 ? (
          <Card padding="lg" className="mt-3 text-center">
            <EmptyState
              compact
              icon={MapPin}
              title={addresses.length === 0 ? "No saved addresses" : "No matches"}
              description={
                addresses.length === 0
                  ? "Add an address and it will appear here for next time."
                  : "Try a different search term."
              }
            />
          </Card>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {filtered.map((address) => {
              const IconForLabel = LABEL_ICONS[address.label] ?? MapPin;
              const selected = value?.id === address.id;
              return (
                <li key={address.id}>
                  <div
                    className={cn(
                      "group relative h-full rounded-xl border p-3.5 text-left transition-all",
                      selected
                        ? "border-primary bg-primary-light/40 dark:bg-primary/10"
                        : "border-line bg-card hover:border-primary/40 hover:shadow-card",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onChange(toDraft(address))}
                      aria-pressed={selected}
                      className="flex w-full items-start gap-2.5 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          selected ? "bg-card text-primary" : "bg-muted text-ink-secondary",
                        )}
                        aria-hidden="true"
                      >
                        <IconForLabel className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-ink">
                            {address.label}
                          </span>
                          {address.isDefault ? (
                            <Star
                              className="size-3 shrink-0 fill-warning text-warning"
                              aria-label="Default address"
                            />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-secondary">
                          {address.addressLine}
                        </span>
                        <span className="block truncate text-[11px] text-ink-muted">
                          {address.city} · {address.postalCode}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => remove.mutate(address.id)}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg text-ink-muted opacity-0 transition-all hover:bg-error-light hover:text-error focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100"
                      aria-label={`Delete ${address.label} address`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AddressDialog
        role={role}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(address) => onChange(toDraft(address))}
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              New address form                              */
/* -------------------------------------------------------------------------- */

function AddressDialog({
  role,
  open,
  onOpenChange,
  onCreated,
}: {
  role: "pickup" | "destination";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (address: Address) => void;
}) {
  const { create, isPending } = useAddressMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: role === "pickup" ? "Home" : "Other",
      addressLine: "",
      city: "",
      postalCode: "",
      latitude: 6.9271,
      longitude: 79.8612,
      recipientName: "",
      contactNumber: "",
      province: "",
      deliveryInstructions: "",
    },
  });

  const onSubmit = (values: AddressInput) => {
    create.mutate(
      {
        label: values.label,
        recipientName: values.recipientName,
        contactNumber: values.contactNumber,
        addressLine: values.addressLine,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        deliveryInstructions: values.deliveryInstructions,
      },
      {
        onSuccess: (address) => {
          onCreated(address);
          onOpenChange(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a {role === "pickup" ? "pickup" : "dropoff"} address</DialogTitle>
          <DialogDescription>
            Saved addresses can be reused for future bookings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field required>
              <FieldLabel htmlFor="address-label" required>
                Label
              </FieldLabel>
              <Input
                id="address-label"
                placeholder="Home, Work, Office…"
                invalid={Boolean(errors.label)}
                {...register("label")}
              />
              <FieldError>{errors.label?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="address-recipient">Recipient name</FieldLabel>
              <Input
                id="address-recipient"
                placeholder="Who receives the parcel?"
                icon={<User />}
                invalid={Boolean(errors.recipientName)}
                {...register("recipientName")}
              />
              <FieldError>{errors.recipientName?.message}</FieldError>
            </Field>
          </div>

          <Field required>
            <FieldLabel htmlFor="address-line" required>
              Street address
            </FieldLabel>
            <Input
              id="address-line"
              placeholder="No. 24, Fleet Street"
              invalid={Boolean(errors.addressLine)}
              {...register("addressLine")}
            />
            <FieldError>{errors.addressLine?.message}</FieldError>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field required>
              <FieldLabel htmlFor="address-city" required>
                City
              </FieldLabel>
              <Input
                id="address-city"
                placeholder="Colombo"
                invalid={Boolean(errors.city)}
                {...register("city")}
              />
              <FieldError>{errors.city?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="address-province">Province</FieldLabel>
              <Input
                id="address-province"
                placeholder="Western"
                invalid={Boolean(errors.province)}
                {...register("province")}
              />
              <FieldError>{errors.province?.message}</FieldError>
            </Field>

            <Field required>
              <FieldLabel htmlFor="address-postal" required>
                Postal code
              </FieldLabel>
              <Input
                id="address-postal"
                placeholder="00700"
                inputMode="numeric"
                invalid={Boolean(errors.postalCode)}
                {...register("postalCode")}
              />
              <FieldError>{errors.postalCode?.message}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="address-contact">Contact number</FieldLabel>
            <Input
              id="address-contact"
              type="tel"
              placeholder="+94 77 000 0000"
              icon={<Phone />}
              invalid={Boolean(errors.contactNumber)}
              {...register("contactNumber")}
            />
            <FieldError>{errors.contactNumber?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="address-instructions">Delivery instructions</FieldLabel>
            <Input
              id="address-instructions"
              placeholder="Gate code, landmark, who to hand it to…"
              invalid={Boolean(errors.deliveryInstructions)}
              {...register("deliveryInstructions")}
            />
            <FieldError>{errors.deliveryInstructions?.message}</FieldError>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field required>
              <FieldLabel htmlFor="address-lat" required>
                Latitude
              </FieldLabel>
              <Input
                id="address-lat"
                inputMode="decimal"
                invalid={Boolean(errors.latitude)}
                {...register("latitude")}
              />
              <FieldError>{errors.latitude?.message}</FieldError>
            </Field>

            <Field required>
              <FieldLabel htmlFor="address-lng" required>
                Longitude
              </FieldLabel>
              <Input
                id="address-lng"
                inputMode="decimal"
                invalid={Boolean(errors.longitude)}
                {...register("longitude")}
              />
              <FieldError>{errors.longitude?.message}</FieldError>
            </Field>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save address
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
