import * as React from "react";
import Link from "next/link";
import type { UseFormRegisterReturn } from "react-hook-form";
import {
  BadgeCheck,
  Clock3,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Field, FieldError, FieldLabel } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/logo";
import { FormErrorBanner } from "@/components/ui/states";
import { SUPPORT_EMAIL } from "@/config";

/* -------------------------------------------------------------------------- */
/*                              Auth split shell                              */
/* -------------------------------------------------------------------------- */

const TRUST_POINTS: readonly { icon: LucideIcon; label: string; note: string }[] = [
  { icon: Clock3, label: "Couriers in minutes", note: "Average pickup under 30 minutes" },
  { icon: MapPin, label: "Live tracking", note: "Follow every active delivery" },
  { icon: ShieldCheck, label: "Verified riders", note: "Identity-checked couriers" },
  { icon: BadgeCheck, label: "Proof of delivery", note: "Photos and timestamps on every job" },
];

export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#10233F] via-[#15325C] to-primary p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="absolute inset-0 opacity-[0.12]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-black leading-tight tracking-tight xl:text-4xl">
            Deliveries you can actually follow.
          </h2>
          <p className="mt-3 text-pretty text-base leading-relaxed text-white/70">
            One account for bookings, live tracking, receipts and support — whether you send one
            parcel a week or a hundred a day.
          </p>

          <ul className="mt-8 space-y-4">
            {TRUST_POINTS.map(({ icon: Icon, label, note }) => (
              <li key={label} className="flex items-start gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-secondary"
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{label}</span>
                  <span className="block text-xs text-white/60">{note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 border-t border-white/10 pt-6">
          <span
            className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-secondary"
            aria-hidden="true"
          >
            <Headphones className="size-5" />
          </span>
          <p className="text-xs leading-relaxed text-white/60">
            Need help?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-white hover:underline">
              {SUPPORT_EMAIL}
            </a>
            <br />
            Support is available 24/7 for active deliveries.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main id="main-content" className="flex items-center justify-center bg-app-bg px-4 py-10 sm:px-6 lg:px-10">
        <div className={cn("w-full max-w-md", className)}>
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
          ) : null}

          <div className="mt-7">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Password toggle                                */
/* -------------------------------------------------------------------------- */

export function PasswordInput({
  id,
  placeholder,
  autoComplete = "current-password",
  invalid,
  registration,
  error,
}: {
  id: string;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  const [visible, setVisible] = React.useState(false);

  return (
    <>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        icon={<Lock />}
        invalid={invalid}
        className="pr-11"
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      {error ? <FieldError>{error}</FieldError> : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Demo credential                               */
/* -------------------------------------------------------------------------- */

export function DemoCredentialHint({
  label,
  email,
  password,
  onUse,
  className,
}: {
  label: string;
  email: string;
  password: string;
  onUse?: () => void;
  className?: string;
}) {
  return (
    <Card padding="sm" className={cn("border-dashed bg-muted/40", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant="warning" size="sm">
          Demo
        </Badge>
        <p className="min-w-0 flex-1 text-xs text-ink-muted">
          <span className="font-semibold text-ink-secondary">{label}:</span>{" "}
          <span className="font-mono">{email}</span> ·{" "}
          <span className="font-mono">{password}</span>
        </p>
        {onUse ? (
          <Button type="button" variant="ghost" size="sm" onClick={onUse}>
            Fill
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Shared field pieces                             */
/* -------------------------------------------------------------------------- */

export function AuthFieldError({ error }: { error?: string }) {
  return <FieldError>{error}</FieldError>;
}

export function AuthFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

export const AUTH_ICONS = { User, Mail, Phone } as const;

export { Field, FieldLabel, FormErrorBanner };
