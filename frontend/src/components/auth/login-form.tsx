"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, LogIn, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { useLogin } from "@/hooks/queries";
import { useAuthStore } from "@/store/auth-store";
import { roleHome } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input, Field, FieldLabel } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/ui/states";
import { AuthFooterLink, AuthShell, DemoCredentialHint, PasswordInput } from "@/components/auth/auth-shell";
import { DEMO_CREDENTIALS } from "@/constants/design";
import { errorMessage } from "@/hooks/queries";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate, isPending, error } = useLogin();
  const setSession = useAuthStore((s) => s.setSession);

  const nextPath = searchParams.get("next");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = (values: LoginInput) => {
    mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: (session) => {
          setSession(session.user);
          router.replace(
            nextPath && nextPath.startsWith("/") ? nextPath : roleHome(session.user.role),
          );
        },
      },
    );
  };

  const fillDemo = (role: "customer" | "admin") => {
    const creds = DEMO_CREDENTIALS[role];
    setValue("email", creds.email, { shouldValidate: true });
    setValue("password", creds.password, { shouldValidate: true });
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to book deliveries, track parcels and manage your account."
      footer={
        <p className="text-center text-sm text-ink-muted">
          New to GoRideXpress?{" "}
          <AuthFooterLink href="/register">Create an account</AuthFooterLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormErrorBanner message={errorMessage(error, "Could not sign you in.")} />

        <Field required>
          <FieldLabel htmlFor="login-email" required>
            Email address
          </FieldLabel>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            icon={<AtSign />}
            invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-error">{errors.email.message}</p> : null}
        </Field>

        <Field required>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <FieldLabel htmlFor="login-password" required>
              Password
            </FieldLabel>
            <AuthFooterLink href="/forgot-password">Forgot password?</AuthFooterLink>
          </div>
          <div className="relative">
            <PasswordInput
              id="login-password"
              placeholder="Your password"
              registration={register("password")}
              invalid={Boolean(errors.password)}
              error={errors.password?.message}
            />
          </div>
        </Field>

        <div className="flex items-center gap-2.5">
          <Checkbox
            id="login-remember"
            checked={rememberMe}
            onChange={(event) => setValue("rememberMe", event.target.checked)}
            label="Keep me signed in on this device"
          />
        </div>

        <Button type="submit" size="block" loading={isPending} rightIcon={<LogIn />}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Demo accounts
        </p>
        <DemoCredentialHint
          label="Customer"
          email={DEMO_CREDENTIALS.customer.email}
          password={DEMO_CREDENTIALS.customer.password}
          onUse={() => fillDemo("customer")}
        />
        <DemoCredentialHint
          label="Admin"
          email={DEMO_CREDENTIALS.admin.email}
          password={DEMO_CREDENTIALS.admin.password}
          onUse={() => fillDemo("admin")}
        />
        <p className="text-xs text-ink-muted">
          Payments are simulated — never enter a real card number.
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/" className="hover:text-primary">
          ← Back to homepage
        </Link>
      </p>
    </AuthShell>
  );
}
