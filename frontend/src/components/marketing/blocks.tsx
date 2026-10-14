import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/overlays";
import { RatingStars } from "@/components/shared/status";

/* ======================================================================== */
/*                                 Container                                 */
/* ======================================================================== */

export function Container({
  children,
  className,
  size = "default",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide" | "marketing" | "full";
  as?: "div" | "section" | "header" | "footer" | "main" | "article";
}) {
  const width = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
    /** Matches the public navbar and hero gutter, so the home page shares one edge. */
    marketing: "max-w-[1440px]",
    full: "max-w-[100rem]",
  }[size];

  return (
    <Tag className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", width, className)}>{children}</Tag>
  );
}

/* ======================================================================== */
/*                                   Section                                 */
/* ======================================================================== */

export function Section({
  children,
  className,
  id,
  tone = "default",
  size = "default",
  as: Tag = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "primary" | "dark";
  size?: "narrow" | "default" | "wide" | "marketing" | "full";
  as?: "section" | "div" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  const tones = {
    default: "",
    muted: "bg-muted/50",
    primary: "bg-primary-light/40",
    dark: "bg-[#10233F] text-white",
  }[tone];

  return (
    <Tag
      id={id}
      className={cn("scroll-mt-20 py-12 sm:py-16 lg:py-20", tones, className)}
      {...rest}
    >
      <Container size={size}>{children}</Container>
    </Tag>
  );
}

/* ======================================================================== */
/*                                Section header                             */
/* ======================================================================== */

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        action && "sm:flex-row sm:items-end sm:justify-between sm:text-left",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <Badge
            variant={tone === "dark" ? "solid" : "primary"}
            size="sm"
            className={cn("mb-3", tone === "dark" && "bg-white/15 text-white")}
          >
            {eyebrow}
          </Badge>
        ) : null}
        <h2
          className={cn(
            "text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl",
            tone === "dark" ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-3 text-pretty text-base leading-relaxed sm:text-lg",
              tone === "dark" ? "text-white/75" : "text-ink-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ======================================================================== */
/*                                  Eyebrow                                 */
/* ======================================================================== */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary",
        className,
      )}
    >
      <span className="h-px w-6 bg-primary/40" aria-hidden="true" />
      {children}
    </p>
  );
}

/* ======================================================================== */
/*                                Feature grid                              */
/* ======================================================================== */

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

export function FeatureGrid({
  features,
  cols = 3,
  className,
  tone = "light",
}: {
  features: readonly FeatureItem[];
  cols?: 2 | 3 | 4;
  className?: string;
  tone?: "light" | "dark";
}) {
  const grid = {
    2: "grid-cols-1 xs:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 xs:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <ul className={cn("grid gap-4 sm:gap-5", grid, className)}>
      {features.map(({ icon: Icon, title, description, href }) => {
        const body = (
          <>
            <span
              className={cn(
                "mb-4 flex size-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                tone === "dark"
                  ? "bg-white/10 text-secondary"
                  : "bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light",
              )}
              aria-hidden="true"
            >
              <Icon className="size-6" />
            </span>
            <h3
              className={cn(
                "text-base font-semibold sm:text-lg",
                tone === "dark" ? "text-white" : "text-ink",
              )}
            >
              {title}
            </h3>
            <p
              className={cn(
                "mt-1.5 text-sm leading-relaxed",
                tone === "dark" ? "text-white/70" : "text-ink-muted",
              )}
            >
              {description}
            </p>
            {href ? (
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-1 text-sm font-semibold",
                  tone === "dark" ? "text-secondary" : "text-primary",
                )}
              >
                Learn more
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
            ) : null}
          </>
        );

        return (
          <li key={title} className="h-full">
            {href ? (
              <Link
                href={href}
                className={cn(
                  "group flex h-full flex-col rounded-2xl p-5 transition-all hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:p-6",
                  tone === "dark"
                    ? "border border-white/10 bg-white/5 hover:border-white/25"
                    : "border border-line bg-card shadow-card hover:border-primary/30 hover:shadow-elevated",
                )}
              >
                {body}
              </Link>
            ) : (
              <div
                className={cn(
                  "group flex h-full flex-col rounded-2xl p-5 sm:p-6",
                  tone === "dark"
                    ? "border border-white/10 bg-white/5"
                    : "border border-line bg-card shadow-card",
                )}
              >
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ======================================================================== */
/*                              Process timeline                             */
/* ======================================================================== */

export function ProcessSteps({
  steps,
  className,
  tone = "light",
}: {
  steps: readonly { title: string; description: string; icon?: LucideIcon }[];
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <ol className={cn("relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8", className)}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.title} className="relative flex gap-4 lg:flex-col lg:gap-3">
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[19px] top-12 hidden h-[calc(100%-1rem)] w-0.5 lg:block",
                  tone === "dark" ? "bg-white/15" : "bg-line",
                )}
                aria-hidden="true"
              />
            ) : null}

            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm lg:size-12">
              {Icon ? <Icon className="size-5 lg:size-6" aria-hidden="true" /> : index + 1}
              <span
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#10233F] text-[10px] font-bold text-white ring-2 ring-card"
                aria-hidden="true"
              >
                {index + 1}
              </span>
            </span>

            <div className="min-w-0 pb-2 lg:pb-0">
              <h3
                className={cn(
                  "text-base font-semibold",
                  tone === "dark" ? "text-white" : "text-ink",
                )}
              >
                {step.title}
              </h3>
              <p
                className={cn(
                  "mt-1.5 text-sm leading-relaxed",
                  tone === "dark" ? "text-white/70" : "text-ink-muted",
                )}
              >
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ======================================================================== */
/*                                 Stats band                                */
/* ======================================================================== */

export function StatsBand({
  stats,
  className,
  tone = "light",
}: {
  stats: readonly { label: string; value: string; hint?: string }[];
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-6 lg:grid-cols-4",
        className,
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center sm:text-left">
          <dt
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              tone === "dark" ? "text-white/60" : "text-ink-muted",
            )}
          >
            {stat.label}
          </dt>
          <dd
            className={cn(
              "mt-1.5 text-2xl font-black tabular-nums sm:text-3xl lg:text-4xl",
              tone === "dark" ? "text-white" : "text-primary",
            )}
          >
            {stat.value}
          </dd>
          {stat.hint ? (
            <p
              className={cn(
                "mt-1 text-xs",
                tone === "dark" ? "text-white/50" : "text-ink-muted",
              )}
            >
              {stat.hint}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

/* ======================================================================== */
/*                                CTA band                                  */
/* ======================================================================== */

export function CtaBand({
  title,
  description,
  primary,
  secondary,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10233F] via-[#15325C] to-primary p-6 shadow-elevated sm:p-10 lg:p-12",
        className,
      )}
    >
      <div
        className="absolute -right-16 -top-16 size-64 rounded-full bg-white/5"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-10 size-56 rounded-full bg-secondary/10"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-pretty text-base leading-relaxed text-white/75">{description}</p>
          ) : null}
        </div>

        {primary || secondary ? (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            {primary ? (
              <Button asChild size="lg" variant="inverse" className="w-full sm:w-auto">
                <Link href={primary.href}>
                  {primary.label}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
            {secondary ? (
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="w-full border-white/25 text-white hover:bg-white/10 sm:w-auto"
              >
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ======================================================================== */
/*                                    FAQ                                    */
/* ======================================================================== */

export function FaqAccordion({
  items,
  className,
  defaultOpen,
}: {
  items: readonly { question: string; answer: React.ReactNode }[];
  className?: string;
  defaultOpen?: string;
}) {
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen} className={cn("w-full", className)}>
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
            {item.question}
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-sm leading-relaxed text-ink-muted">{item.answer}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/* ======================================================================== */
/*                                Testimonials                               */
/* ======================================================================== */

export function Testimonials({
  items,
  className,
}: {
  items: readonly {
    quote: string;
    name: string;
    role?: string;
    rating?: number;
    initials?: string;
  }[];
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <li key={item.name}>
          <Card interactive="hover" padding="lg" className="flex h-full flex-col gap-3">
            <RatingStars value={item.rating ?? 5} size="sm" />
            <blockquote className="flex-1 text-sm leading-relaxed text-ink-secondary">
              “{item.quote}”
            </blockquote>
            <figcaption className="flex items-center gap-3 border-t border-line pt-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-light text-xs font-bold uppercase text-secondary-dark dark:text-secondary-light"
                aria-hidden="true"
              >
                {item.initials ?? item.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                {item.role ? (
                  <span className="block truncate text-xs text-ink-muted">{item.role}</span>
                ) : null}
              </span>
            </figcaption>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/* ======================================================================== */
/*                              Service / pricing                            */
/* ======================================================================== */

export function ServiceCards({
  items,
  className,
}: {
  items: readonly {
    icon: LucideIcon;
    title: string;
    description: string;
    price: string;
    eta: string;
    href: string;
    featured?: boolean;
  }[];
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map(({ icon: Icon, title, description, price, eta, href, featured }) => (
        <li key={title} className="h-full">
          <Card
            interactive="hover"
            padding="lg"
            className={cn(
              "relative flex h-full flex-col",
              featured && "border-primary/40 shadow-elevated ring-1 ring-primary/20",
            )}
          >
            {featured ? (
              <Badge variant="primary" size="sm" className="absolute -top-2.5 left-5">
                Most popular
              </Badge>
            ) : null}

            <span
              className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
              aria-hidden="true"
            >
              <Icon className="size-6" />
            </span>

            <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{description}</p>

            <div className="mt-4 border-t border-line pt-4">
              <p className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums text-ink">{price}</span>
                <span className="text-xs text-ink-muted">starting</span>
              </p>
              <p className="mt-1 text-xs text-ink-muted">{eta}</p>
            </div>

            <Button asChild variant={featured ? "primary" : "outline"} size="sm" className="mt-4 w-full">
              <Link href={href}>Get started</Link>
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/* ======================================================================== */
/*                              Comparison table                             */
/* ======================================================================== */

export function ComparisonTable({
  columns,
  rows,
  className,
}: {
  columns: readonly string[];
  rows: readonly { feature: string; values: (string | boolean)[]; highlight?: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-line bg-card shadow-card", className)}>
      <table className="w-full min-w-[38rem] border-collapse text-sm">
        <caption className="sr-only">Service comparison table</caption>
        <thead>
          <tr className="border-b border-line bg-muted/60">
            <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
              Feature
            </th>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-ink"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.feature} className={cn("transition-colors hover:bg-muted/40", row.highlight && "bg-primary-light/30")}>
              <th scope="row" className="px-4 py-3.5 text-left font-medium text-ink-secondary">
                {row.feature}
              </th>
              {row.values.map((value, i) => (
                <td key={i} className="px-4 py-3.5 text-center">
                  {value === true ? (
                    <span className="font-bold text-success" aria-label="Included">
                      ✓
                    </span>
                  ) : value === false ? (
                    <span className="text-ink-disabled" aria-label="Not included">
                      —
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-ink-secondary">{value}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
