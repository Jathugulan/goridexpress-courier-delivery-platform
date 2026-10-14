import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Surface                                  */
/* -------------------------------------------------------------------------- */

export const surfaceVariants = cva(
  "rounded-2xl border border-line bg-card transition-[box-shadow,border-color,transform] duration-200",
  {
    variants: {
      elevation: {
        none: "shadow-none",
        xs: "shadow-xs",
        sm: "shadow-sm",
        card: "shadow-card",
        elevated: "shadow-elevated",
      },
      interactive: {
        none: "",
        hover: "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated",
        press: "hover:shadow-card active:translate-y-0",
        select: "cursor-pointer",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4 sm:p-5",
        lg: "p-5 sm:p-6",
        xl: "p-6 sm:p-8",
      },
    },
    defaultVariants: { elevation: "card", interactive: "none", padding: "lg" },
  },
);

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  asChild?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                    Card                                    */
/* -------------------------------------------------------------------------- */

export const Card = React.forwardRef<HTMLDivElement, SurfaceProps>(function Card(
  { className, elevation, interactive, padding, ...props },
  ref,
) {
  return <div ref={ref} className={cn(surfaceVariants({ elevation, interactive, padding }), className)} {...props} />;
});

Card.displayName = "Card";

/* -------------------------------------------------------------------------- */
/*                                 Card parts                                 */
/* -------------------------------------------------------------------------- */

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex min-h-[3.25rem] flex-col justify-center gap-1 border-b border-line px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: Tag = "h3",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" }) {
  return <Tag className={cn("text-base font-semibold text-ink sm:text-lg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-ink-muted", className)} {...props} />;
}

export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ml-auto flex shrink-0 items-center gap-2", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "between" }) {
  const align = props.align ?? "between";
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-line px-5 py-3.5",
        align === "end" && "justify-end",
        align === "between" && "justify-between",
        align === "start" && "justify-start",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  CardGrid                                  */
/* -------------------------------------------------------------------------- */

export function CardGrid({
  className,
  children,
  cols = 1,
  gap = "md",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4 | 5;
  gap?: "sm" | "md" | "lg";
}) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 xs:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  }[cols];

  const gapClass = { sm: "gap-3", md: "gap-4", lg: "gap-5 lg:gap-6" }[gap];

  return (
    <div className={cn("grid", colsClass, gapClass, className)} {...props}>
      {children}
    </div>
  );
}
