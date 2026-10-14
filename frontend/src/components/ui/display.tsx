"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

/* ======================================================================== */
/*                                  Avatar                                   */
/* ======================================================================== */

export function Avatar({
  className,
  src,
  alt,
  fallback,
  size = "md",
  status,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "busy" | "offline" | "suspended";
}) {
  const sizes = {
    xs: "size-7 text-[10px]",
    sm: "size-9 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-16 text-xl",
  }[size];

  const statusTone = {
    online: "bg-success",
    busy: "bg-warning",
    offline: "bg-ink-disabled",
    suspended: "bg-error",
  }[status ?? "offline"];

  return (
    <span className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light font-semibold uppercase text-primary-dark dark:bg-primary/20 dark:text-primary-light",
          sizes,
          className,
        )}
        {...props}
      >
        {src ? (
          <AvatarPrimitive.Image src={src} alt={alt ?? ""} className="size-full object-cover" />
        ) : null}
        <AvatarPrimitive.Fallback delayMs={0} className="flex size-full items-center justify-center">
          {fallback ?? "GR"}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card",
            statusTone,
          )}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

/* ======================================================================== */
/*                                 Tooltip                                   */
/* ======================================================================== */

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[90] max-w-64 rounded-lg bg-[#10233F] px-2.5 py-1.5 text-xs font-medium text-white shadow-elevated",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[#10233F]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function Tooltip({
  label,
  children,
  side = "top",
  align = "center",
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  if (!label) return <>{children}</>;
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent side={side} align={align} className={className}>
        {label}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

/* ======================================================================== */
/*                                Separator                                  */
/* ======================================================================== */

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

/** Labeled section divider, e.g. "or continue with". */
export function LabeledSeparator({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("relative flex items-center gap-3 py-1", className)}>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}
