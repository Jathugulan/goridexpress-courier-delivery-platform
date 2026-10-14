"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, AtSign, CheckCircle2, KeyRound, MailCheck, Send } from "lucide-react";
import { z } from "zod";
import { errorMessage, useForgotPassword, useResetPassword } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field, FieldLabel } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/ui/states";
import { AuthFooterLink, AuthShell, PasswordInput } from "@/components/auth/auth-shell";

/* -------------------------------------------------------------------------- */
/*                              Forgot password                               */
/* -------------------------------------------------------------------------- */

const forgotSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});

type ForgotInput = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const { mutate, isPending, error, isSuccess, data } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  if (isSuccess) {
    return (
      <AuthShell
        title="Check your inbox"
        description="If an account exists for that address, a password reset link is on its way."
        footer={
          <p className="text-center text-sm text-ink-muted">
            Remembered it?{" "}
            <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
          </p>
        }
      >
        <Card padding="lg" className="text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-success-light text-success-dark dark:text-success-light"
            aria-hidden="true"
          >
            <MailCheck className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-ink">Reset link sent</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            {data?.message ??
              "Follow the link in that email to choose a new password. The link expires in 30 minutes."}
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Nothing arrived? Check your spam folder, then try again.
          </p>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address on your account and we will send a reset link."
      footer={
        <p className="text-center text-sm text-ink-muted">
          Remembered it?{" "}
          <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit((v) => mutate(v.email))} noValidate className="space-y-4">
        <FormErrorBanner message={errorMessage(error, "Could not send the reset link.")} />

        <Field required>
          <FieldLabel htmlFor="forgot-email" required>
            Email address
          </FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<AtSign />}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-error">{errors.email.message}</p> : null}
        </Field>

        <Button type="submit" size="block" loading={isPending} rightIcon={<Send />}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/login" className="inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Reset password                               */
/* -------------------------------------------------------------------------- */

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "That password is too long")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetInput = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate, isPending, error, isSuccess } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (isSuccess) {
    return (
      <AuthShell
        title="Password updated"
        description="Your new password is active. You can sign in with it now."
        footer={
          <p className="text-center text-sm text-ink-muted">
            <AuthFooterLink href="/login">Continue to sign in</AuthFooterLink>
          </p>
        }
      >
        <Card padding="lg" className="text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-success-light text-success-dark dark:text-success-light"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-ink">All set</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Any other sessions have been signed out. Use your new password the next time you log in.
          </p>
          <Button className="mt-5" onClick={() => router.replace("/login")}>
            Go to sign in
          </Button>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Pick something you have not used before. You will be signed out everywhere else."
      footer={
        <p className="text-center text-sm text-ink-muted">
          <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
        </p>
      }
    >
      {!token ? (
        <Card padding="lg" className="text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-warning-light text-warning-dark dark:text-warning-light"
            aria-hidden="true"
          >
            <KeyRound className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-ink">Reset link missing</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            This page needs a reset token. Open the link from your password reset email, or request
            a new one.
          </p>
          <Button asChild className="mt-5">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit((v) =>
            mutate({ token, password: v.password, confirmPassword: v.confirmPassword }),
          )}
          noValidate
          className="space-y-4"
        >
          <FormErrorBanner
            message={errorMessage(error, "Could not reset your password. The link may have expired.")}
          />

          <Field required>
            <FieldLabel htmlFor="reset-password" required>
              New password
            </FieldLabel>
            <PasswordInput
              id="reset-password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              registration={register("password")}
              invalid={Boolean(errors.password)}
              error={errors.password?.message}
            />
          </Field>

          <Field required>
            <FieldLabel htmlFor="reset-confirm" required>
              Confirm new password
            </FieldLabel>
            <PasswordInput
              id="reset-confirm"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              registration={register("confirmPassword")}
              invalid={Boolean(errors.confirmPassword)}
              error={errors.confirmPassword?.message}
            />
          </Field>

          <Button type="submit" size="block" loading={isPending}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
