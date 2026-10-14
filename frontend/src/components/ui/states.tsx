"use client";

import * as React from "react";
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  PackageX,
  SearchX,
  ServerCrash,
  ShieldAlert,
  WifiOff,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button, buttonVariants } from "./button";

/* ======================================================================== */
/*                                   Alert                                   */
/* ======================================================================== */

const ALERT_TONE: Record<Tone, { wrap: string; icon: string; Icon: LucideIcon }> = {
  primary: { wrap: "border-primary/25 bg-primary-light/60 text-primary-dark dark:text-primary-light", icon: "text-primary", Icon: Info },
  secondary: { wrap: "border-secondary/25 bg-secondary-light/60 text-secondary-dark dark:text-secondary-light", icon: "text-secondary", Icon: Info },
  success: { wrap: "border-success/25 bg-success-light/70 text-success-dark dark:text-success-light", icon: "text-success", Icon: CheckCircle2 },
  warning: { wrap: "border-warning/35 bg-warning-light/70 text-warning-dark dark:text-warning-light", icon: "text-warning", Icon: AlertTriangle },
  error: { wrap: "border-error/25 bg-error-light/70 text-error-dark dark:text-error-light", icon: "text-error", Icon: AlertCircle },
  info: { wrap: "border-info/25 bg-info-light/70 text-info-dark dark:text-info-light", icon: "text-info", Icon: Info },
  neutral: { wrap: "border-line bg-muted/60 text-ink-secondary", icon: "text-ink-muted", Icon: Info },
  purple: { wrap: "border-violet-500/25 bg-violet-50 text-violet-800 dark:border-violet-400/25 dark:bg-violet-950/50 dark:text-violet-200", icon: "text-violet-600 dark:text-violet-300", Icon: Info },
};

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: Tone;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  onDismiss?: () => void;
  compact?: boolean;
}

export function Alert({
  tone = "info",
  title,
  description,
  icon,
  action,
  onDismiss,
  compact,
  className,
  children,
  ...props
}: AlertProps) {
  const config = ALERT_TONE[tone] ?? ALERT_TONE.info;
  const Icon = icon ?? config.Icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border",
        compact ? "p-3" : "p-4",
        config.wrap,
        className,
      )}
      {...props}
    >
      <Icon className={cn("mt-0.5 size-[18px] shrink-0", config.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        {description ? (
          <div className={cn("text-sm leading-relaxed", title && "mt-0.5", "opacity-90")}>{description}</div>
        ) : null}
        {children}
        {action ? <div className="mt-3 flex flex-wrap gap-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
        >
          <XCircle className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                               Empty state                                 */
/* ======================================================================== */

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  compact?: boolean;
  tone?: Tone;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  secondaryAction,
  compact,
  tone = "primary",
  className,
  children,
  ...props
}: EmptyStateProps) {
  const toneRing: Record<Tone, string> = {
    primary: "bg-primary-light text-primary",
    secondary: "bg-secondary-light text-secondary",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    error: "bg-error-light text-error",
    info: "bg-info-light text-info",
    neutral: "bg-muted text-ink-muted",
    purple: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-card/60 text-center",
        compact ? "px-5 py-8" : "px-6 py-12 sm:py-16",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-2xl [&_svg]:size-6",
          toneRing[tone],
        )}
        aria-hidden="true"
      >
        <Icon />
      </span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted text-pretty">
          {description}
        </p>
      ) : null}
      {children}
      {action || secondaryAction ? (
        <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                                Error state                                */
/* ======================================================================== */

export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  description?: React.ReactNode;
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "inline" | "card";
  children?: React.ReactNode;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  code,
  onRetry,
  retryLabel = "Try again",
  variant = "card",
  className,
  children,
  action,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-error/25 bg-error-light/40 text-center",
        variant === "card" ? "px-6 py-12" : "px-4 py-6",
        className,
      )}
      {...props}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-error-light text-error" aria-hidden="true">
        <ServerCrash className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-secondary text-pretty">
          {description}
        </p>
      ) : null}
      {code ? <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">{code}</p> : null}
      {children}
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry} variant="outline">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Specialised error states                        */
/* -------------------------------------------------------------------------- */

type SpecialStateProps = Omit<ErrorStateProps, "title" | "onRetry" | "retryLabel" | "code" | "variant">;

export function UnauthorizedState({
  message = "You need to sign in to continue.",
  action,
  className,
  ...props
}: SpecialStateProps & { message?: string; action?: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-card px-6 py-12 text-center shadow-card",
        className,
      )}
      {...props}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-warning-light text-warning" aria-hidden="true">
        <Lock className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">Authentication required</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{message}</p>
      <div className="mt-6">{action ?? <Button asChild variant="primary">Sign in</Button>}</div>
    </div>
  );
}

export function ForbiddenState({
  message = "You don't have permission to access this page.",
  action,
  className,
  ...props
}: SpecialStateProps & { message?: string; action?: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-card px-6 py-12 text-center shadow-card",
        className,
      )}
      {...props}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-error-light text-error" aria-hidden="true">
        <ShieldAlert className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">403 — Forbidden</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{message}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}

export function NotFoundState({
  title = "Not found",
  description,
  action,
  className,
  ...props
}: Omit<ErrorStateProps, "onRetry" | "retryLabel" | "code" | "variant">) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-card px-6 py-14 text-center shadow-card",
        className,
      )}
      {...props}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-ink-muted" aria-hidden="true">
        <PackageX className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted text-pretty">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function NetworkErrorState({ onRetry, className, ...props }: ErrorStateProps) {
  return (
    <ErrorState
      title="Network error"
      description="We couldn't reach the GoRideXpress API. Check your connection and try again."
      code="NETWORK_ERROR"
      onRetry={onRetry}
      className={className}
      {...props}
    >
      <span className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
        <WifiOff className="size-3.5" aria-hidden="true" />
        API: {process.env.NEXT_PUBLIC_API_URL ?? "not configured"}
      </span>
    </ErrorState>
  );
}

/* ======================================================================== */
/*                                 Success                                   */
/* ======================================================================== */

export function SuccessState({
  title,
  description,
  action,
  className,
  children,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-success/25 bg-success-light/40 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-success-light text-success" aria-hidden="true">
        <CheckCircle2 className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-secondary text-pretty">
          {description}
        </p>
      ) : null}
      {children}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* ======================================================================== */
/*                          Inline processing / spinner                      */
/* ======================================================================== */

export function InlineSpinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2 text-sm text-ink-muted", className)}
    >
      <span className="relative flex size-4 items-center justify-center">
        <span className="absolute size-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-line border-t-primary" />
      </span>
      {label ? <span>{label}</span> : <span className="sr-only">Loading</span>}
    </span>
  );
}

/** Full-card processing state used by the payment flow. */
export function ProcessingState({
  title = "Processing…",
  description,
  steps,
  className,
}: {
  title?: string;
  description?: string;
  steps?: string[];
  className?: string;
}) {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (!steps?.length) return;
    const interval = window.setInterval(
      () => setActiveStep((s) => (s + 1) % steps.length),
      900,
    );
    return () => window.clearInterval(interval);
  }, [steps]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-card px-6 py-12 text-center shadow-card",
        className,
      )}
    >
      <motion.span
        className="relative mb-5 flex size-16 items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      >
        <span className="absolute inset-0 rounded-full border-[3px] border-line border-t-primary border-r-primary" />
        <span className="size-2.5 rounded-full bg-primary" />
      </motion.span>
      <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {steps?.length ? (
        <ol className="mt-6 w-full max-w-xs space-y-2 text-left">
          {steps.map((step, i) => (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors",
                i <= activeStep ? "text-ink" : "text-ink-muted/60",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                  i < activeStep
                    ? "border-success bg-success text-white"
                    : i === activeStep
                      ? "border-primary bg-primary text-white"
                      : "border-line-strong text-ink-disabled",
                )}
                aria-hidden="true"
              >
                {i < activeStep ? "✓" : i + 1}
              </span>
              {step}
              {i === activeStep ? <span className="sr-only">(current step)</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                              Inline error banner                          */
/* ======================================================================== */

export function FormErrorBanner({
  message,
  className,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-error/30 bg-error-light/60 p-3.5",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-[18px] shrink-0 text-error" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-error-dark dark:text-error-light">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "-mr-1.5 shrink-0")}
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                        Animated state transition wrapper                  */
/* ======================================================================== */

export function StateTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={React.Children.count(children) > 0 ? undefined : "empty"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export type MotionDivProps = HTMLMotionProps<"div">;
export { motion };
