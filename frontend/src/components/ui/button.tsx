"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Variants                                 */
/* -------------------------------------------------------------------------- */

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[11px]",
    "text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-card active:bg-primary-dark",
        secondary:
          "bg-secondary text-white shadow-sm hover:bg-[#0284c7] hover:shadow-card",
        outline:
          "border border-line-strong bg-transparent text-ink hover:bg-muted hover:border-primary/40",
        subtle: "bg-muted text-ink hover:bg-surface-secondary hover:text-primary",
        ghost: "bg-transparent text-ink-secondary hover:bg-muted hover:text-ink",
        link: "bg-transparent text-primary underline-offset-4 hover:underline active:scale-100",
        danger: "bg-error text-white shadow-sm hover:bg-[#b91c1c] hover:shadow-card",
        success: "bg-success text-white shadow-sm hover:bg-success-dark hover:shadow-card",
        warning: "bg-warning text-white shadow-sm hover:bg-[#d97706] hover:shadow-card",
        inverse: "bg-white text-primary shadow-sm hover:bg-[--grx-primary-light]",
        dark: "bg-[#10233F] text-white shadow-sm hover:bg-[#0b1a2f] hover:shadow-card",
      },
      size: {
        xs: "h-8 rounded-lg px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 rounded-[10px] px-3.5 text-[13px] [&_svg]:size-4",
        md: "h-11 px-4 [&_svg]:size-4",
        lg: "h-12 px-6 text-[15px] [&_svg]:size-[18px]",
        icon: "size-11 p-0 [&_svg]:size-[18px]",
        "icon-sm": "size-9 rounded-[10px] p-0 [&_svg]:size-4",
        "icon-xs": "size-8 rounded-lg p-0 [&_svg]:size-3.5",
        block: "h-12 w-full px-6 text-[15px] [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                                   Button                                   */
/* -------------------------------------------------------------------------- */

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;

  if (asChild) {
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/*                             Compound sub-buttons                           */
/* -------------------------------------------------------------------------- */

type IconButtonProps = Omit<ButtonProps, "leftIcon" | "rightIcon" | "children"> & {
  label: string;
  children: React.ReactNode;
};

export function IconButton({ label, children, className, size = "icon-sm", ...props }: IconButtonProps) {
  return (
    <Button size={size} aria-label={label} title={label} className={className} {...props}>
      {children}
    </Button>
  );
}

export function ButtonGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center gap-2 [&>*:not(:first-child)]:ml-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
