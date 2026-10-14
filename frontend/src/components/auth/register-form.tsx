"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Phone, ShieldCheck, User, UserPlus } from "lucide-react";
import { z } from "zod";
import { errorMessage, useRegister } from "@/hooks/queries";
import { useAuthStore } from "@/store/auth-store";
import { roleHome } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input, Checkbox, Field, FieldLabel } from "@/components/ui/input";
import { FormErrorBanner } from "@/components/ui/states";
import { AuthFooterLink, AuthShell, PasswordInput } from "@/components/auth/auth-shell";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Enter your first name").max(50),
    lastName: z.string().trim().min(2, "Enter your last name").max(50),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20, "That phone number is too long"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "That password is too long")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    terms: z.literal(true, { message: "You must accept the terms to continue" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { mutate, isPending, error } = useRegister();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false as unknown as true,
    },
  });

  const terms = watch("terms");

  const onSubmit = (values: RegisterInput) => {
    mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: (session) => {
          setSession(session.user);
          router.replace(roleHome(session.user.role));
        },
      },
    );
  };

  return (
    <AuthShell
      title="Create your account"
      description="Save your addresses, book couriers and follow every delivery live."
      footer={
        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <AuthFooterLink href="/login">Sign in</AuthFooterLink>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormErrorBanner message={errorMessage(error, "Could not create your account.")} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field required>
            <FieldLabel htmlFor="register-first-name" required>
              First name
            </FieldLabel>
            <Input
              id="register-first-name"
              placeholder="Jane"
              autoComplete="given-name"
              icon={<User />}
              invalid={Boolean(errors.firstName)}
              {...register("firstName")}
            />
            {errors.firstName ? (
              <p className="mt-1.5 text-xs text-error">{errors.firstName.message}</p>
            ) : null}
          </Field>

          <Field required>
            <FieldLabel htmlFor="register-last-name" required>
              Last name
            </FieldLabel>
            <Input
              id="register-last-name"
              placeholder="Doe"
              autoComplete="family-name"
              invalid={Boolean(errors.lastName)}
              {...register("lastName")}
            />
            {errors.lastName ? (
              <p className="mt-1.5 text-xs text-error">{errors.lastName.message}</p>
            ) : null}
          </Field>
        </div>

        <Field required>
          <FieldLabel htmlFor="register-email" required>
            Email address
          </FieldLabel>
          <Input
            id="register-email"
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
          <FieldLabel htmlFor="register-phone" required>
            Phone number
          </FieldLabel>
          <Input
            id="register-phone"
            type="tel"
            placeholder="+94 77 000 0000"
            autoComplete="tel"
            icon={<Phone />}
            invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1.5 text-xs text-error">{errors.phone.message}</p> : null}
          <p className="mt-1.5 text-xs text-ink-muted">
            Couriers use this number to contact you about pickups and deliveries.
          </p>
        </Field>

        <Field required>
          <FieldLabel htmlFor="register-password" required>
            Password
          </FieldLabel>
          <PasswordInput
            id="register-password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            registration={register("password")}
            invalid={Boolean(errors.password)}
            error={errors.password?.message}
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            Mix uppercase, lowercase and a number.
          </p>
        </Field>

        <Field required>
          <FieldLabel htmlFor="register-confirm" required>
            Confirm password
          </FieldLabel>
          <PasswordInput
            id="register-confirm"
            placeholder="Repeat your password"
            autoComplete="new-password"
            registration={register("confirmPassword")}
            invalid={Boolean(errors.confirmPassword)}
            error={errors.confirmPassword?.message}
          />
        </Field>

        <div className="space-y-1.5">
          <Checkbox
            id="register-terms"
            checked={terms === true}
            onChange={(event) => setValue("terms", event.target.checked as true, { shouldValidate: true })}
            label="I accept the terms of service and privacy policy"
          />
          {errors.terms ? <p className="text-xs text-error">{errors.terms.message}</p> : null}
        </div>

        <Button type="submit" size="block" loading={isPending} rightIcon={<UserPlus />}>
          Create account
        </Button>

        <p className="flex items-start gap-1.5 text-xs text-ink-muted">
          <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" aria-hidden="true" />
          Your session is stored in a secure HTTP-only cookie — never in browser storage.
        </p>
      </form>
    </AuthShell>
  );
}
