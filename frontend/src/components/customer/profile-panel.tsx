"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, KeyRound, MapPin, MapPinned, Plus, UserRound } from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useAddresses,
  useAddressMutations,
  useOrders,
} from "@/hooks/queries";

import { profileSchema, changePasswordSchema, type ProfileInput, type ChangePasswordInput } from "@/schemas";
import { formatCurrency, formatDate, initialsFrom } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/input";
import { Alert, ErrorState, EmptyState, FormErrorBanner } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/cards";
import { AddressCard } from "@/components/shared/cards";
import { RatingStars } from "@/components/shared/status";



export function ProfilePanel() {
    const { data: profile, isPending, isError, error, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: orderStats } = useOrders({ page: 1, limit: 1 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          profileImage: profile.profileImage ?? "",
        }
      : undefined,
  });

  if (isPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <Card padding="lg">
        <ErrorState
          description={isError ? undefined : "Profile not found."}
          onRetry={() => void refetch()}
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card padding="md" className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-primary-light text-2xl font-bold text-primary dark:bg-primary/15">
            {profile.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profileImage} alt="" className="size-full object-cover" />
            ) : (
              initialsFrom(`${profile.firstName} ${profile.lastName}`)
            )}
          </div>
          <p className="mt-3 text-base font-semibold text-ink">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-xs text-ink-muted">{profile.email}</p>

          <div className="mt-2 flex items-center justify-center gap-1.5">
            <RatingStars value={profile.rating} size="sm" showValue={false} />
            <span className="text-xs text-ink-muted">({profile.rating.toFixed(1)})</span>
          </div>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-left text-xs">
            <Row label="Member since" value={formatDate(profile.createdAt)} />
            <Row label="Total orders" value={String(profile.totalOrders)} />
            <Row label="Completed" value={String(profile.completedOrders)} />
            <Row label="Cancelled" value={String(profile.cancelledOrders)} />
            <Row label="Lifetime spend" value={formatCurrency(profile.totalSpent)} />
          </dl>
        </Card>

        {orderStats ? (
          <StatCard
            label="Orders on this page"
            value={orderStats.pagination.total}
            icon={UserRound}
            tone="primary"
            hint="Across all time"
          />
        ) : null}
      </div>

      <div className="space-y-4">
        <Card padding="md">
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2 text-sm">
              <UserRound className="size-4 text-primary" aria-hidden="true" />
              Personal details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((values) => updateProfile.mutate({ ...values, profileImage: values.profileImage || undefined }))}
              noValidate
              className="space-y-4"
            >
              {updateProfile.isError ? (
                <FormErrorBanner message="Could not save your profile. Check the fields and retry." />
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field required>
                  <FieldLabel htmlFor="profile-first" required>
                    First name
                  </FieldLabel>
                  <Input
                    id="profile-first"
                    invalid={Boolean(errors.firstName)}
                    {...register("firstName")}
                  />
                  <FieldError>{errors.firstName?.message}</FieldError>
                </Field>

                <Field required>
                  <FieldLabel htmlFor="profile-last" required>
                    Last name
                  </FieldLabel>
                  <Input id="profile-last" invalid={Boolean(errors.lastName)} {...register("lastName")} />
                  <FieldError>{errors.lastName?.message}</FieldError>
                </Field>
              </div>

              <Field required>
                <FieldLabel htmlFor="profile-phone" required>
                  Phone
                </FieldLabel>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder="+94 77 000 0000"
                  invalid={Boolean(errors.phone)}
                  {...register("phone")}
                />
                <FieldDescription>Used by couriers to contact you about deliveries.</FieldDescription>
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-image">Profile image URL</FieldLabel>
                <Input
                  id="profile-image"
                  placeholder="https://…"
                  icon={<Camera />}
                  invalid={Boolean(errors.profileImage)}
                  {...register("profileImage")}
                />
                <FieldError>{errors.profileImage?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                <Input id="profile-email" value={profile.email} disabled readOnly />
                <FieldDescription>Contact support to change your email address.</FieldDescription>
              </Field>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  disabled={!isDirty || updateProfile.isPending}
                >
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset()}
                  disabled={!isDirty}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ChangePasswordCard />
        <AddressBookCard />
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2 text-sm">
          <KeyRound className="size-4 text-primary" aria-hidden="true" />
          Change password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) =>
            changePassword.mutate(
              { currentPassword: values.currentPassword, newPassword: values.newPassword, confirmPassword: values.confirmPassword },
              { onSuccess: () => reset() },
            ),
          )}
          noValidate
          className="space-y-4"
        >
          <Field required>
            <FieldLabel htmlFor="pw-current" required>
              Current password
            </FieldLabel>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(errors.currentPassword)}
              {...register("currentPassword")}
            />
            <FieldError>{errors.currentPassword?.message}</FieldError>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field required>
              <FieldLabel htmlFor="pw-new" required>
                New password
              </FieldLabel>
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.newPassword)}
                {...register("newPassword")}
              />
              <FieldError>{errors.newPassword?.message}</FieldError>
            </Field>

            <Field required>
              <FieldLabel htmlFor="pw-confirm" required>
                Confirm password
              </FieldLabel>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword")}
              />
              <FieldError>{errors.confirmPassword?.message}</FieldError>
            </Field>
          </div>

          <Button type="submit" loading={changePassword.isPending}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddressBookCard() {
  const { data, isPending, isError, refetch } = useAddresses();
  const { setDefault, remove } = useAddressMutations();
  const addresses = data?.items ?? [];

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          Address book
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <Alert tone="error" title="Could not load addresses">
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </Alert>
        ) : addresses.length === 0 ? (
          <EmptyState
            compact
            icon={MapPinned}
            title="No saved addresses"
            description="Add addresses while booking your first delivery."
            action={
              <Button asChild size="sm" variant="outline">
                <a href="/customer/delivery/create">
                  <Plus className="size-3.5" aria-hidden="true" />
                  Book a delivery
                </a>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onSetDefault={() => setDefault.mutate(address.id)}
                onDelete={() => remove.mutate(address.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

