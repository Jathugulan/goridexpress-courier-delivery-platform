import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

/* -------------------------------------------------------------------------- */
/*                                  Variants                                  */
/* -------------------------------------------------------------------------- */

export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-primary/20 bg-primary-light text-primary-dark dark:text-primary-light",
        secondary: "border-secondary/25 bg-secondary-light text-secondary-dark dark:text-secondary-light",
        success: "border-success/25 bg-success-light text-success-dark dark:text-success-light",
        warning: "border-warning/30 bg-warning-light text-warning-dark dark:text-warning-light",
        error: "border-error/25 bg-error-light text-error-dark dark:text-error-light",
        info: "border-info/25 bg-info-light text-info-dark dark:text-info-light",
        neutral: "border-line bg-muted text-ink-secondary",
        purple: "border-violet-500/25 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-950/60 dark:text-violet-200",
        outline: "border-line-strong bg-transparent text-ink-secondary",
        solid: "border-transparent bg-[#10233F] text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] leading-4 [&_svg]:size-3",
        md: "px-2.5 py-1 text-xs leading-4 [&_svg]:size-3.5",
        lg: "px-3 py-1.5 text-[13px] leading-5 [&_svg]:size-4",
      },
      /** Adds a soft dot indicator — never the sole status signal. */
      dot: { true: "", false: "" },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
  /** Screen-reader-only prefix, e.g. "Order status: ". */
  srLabel?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Badge                                    */
/* -------------------------------------------------------------------------- */

export function Badge({ className, variant, size, showDot, srLabel, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {showDot ? (
        <span
          className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      ) : null}
      {srLabel ? <span className="sr-only">{srLabel}: </span> : null}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Tone convenience                             */
/* -------------------------------------------------------------------------- */

export interface ToneBadgeProps extends Omit<BadgeProps, "variant"> {
  tone?: Tone;
  icon?: React.ReactNode;
}

export function ToneBadge({ tone = "neutral", icon, srLabel, children, ...props }: ToneBadgeProps) {
  return (
    <Badge variant={tone} showDot {...props}>
      {icon}
      {srLabel ? <span className="sr-only">{srLabel}: </span> : null}
      {children}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Kbd hint                                  */
/* -------------------------------------------------------------------------- */

export function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-line-strong bg-muted px-1.5 font-sans text-[10px] font-semibold text-ink-muted",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
