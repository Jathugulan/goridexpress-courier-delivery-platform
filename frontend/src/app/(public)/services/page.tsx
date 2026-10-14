import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, MapPin, Package, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ComparisonTable, CtaBand, Section, SectionHeader } from "@/components/marketing/blocks";
import { MARKETING_SERVICES } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Delivery services",
  description:
    "Compare parcel delivery, on-demand errands, same-day express and business bulk services. See what each includes, the price you start from and the typical delivery window.",
  alternates: { canonical: "/services" },
};

const COMPARISON = [
  { feature: "Courier dispatched", values: ["30 min", "30 min", "90 min", "Scheduled"] },
  { feature: "Live GPS tracking", values: [true, true, true, true] },
  { feature: "Pickup & dropoff photos", values: [true, true, true, true] },
  { feature: "Proof of delivery", values: [true, true, true, true] },
  { feature: "Scheduled window", values: [false, false, true, true] },
  { feature: "Optional insurance", values: [true, false, true, true] },
  { feature: "Multi-stop route", values: [false, false, false, true] },
  { feature: "Team members & seats", values: [false, false, false, true] },
  { feature: "Monthly invoicing", values: [false, false, false, true] },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="One platform, four ways to send"
        description="Pick the service that matches your urgency and parcel size. Every option includes live tracking, pickup photos and a digital proof of delivery."
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/customer/delivery/create">
                Send a parcel
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </>
        }
      />

      {/* Service detail cards */}
      <Section size="full" className="pt-10 sm:pt-14">
        <ul className="grid gap-5 lg:grid-cols-2">
          {MARKETING_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <li key={service.slug}>
                <Card
                  padding="lg"
                  elevation="elevated"
                  interactive="hover"
                  className="flex h-full flex-col"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                      aria-hidden="true"
                    >
                      <Icon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-ink">{service.title}</h2>
                        {service.popular ? (
                          <Badge variant="primary" size="sm">
                            Most popular
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-ink-secondary">{service.tagline}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">{service.description}</p>

                  <div className="mt-5 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-3xl font-black tabular-nums text-ink">{service.price}</span>
                    <span className="text-xs text-ink-muted">{service.priceNote}</span>
                    <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Clock3 className="size-4" aria-hidden="true" />
                      {service.eta}
                    </span>
                  </div>

                  <div className="mt-5 flex-1 rounded-xl bg-muted/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                      What&apos;s included
                    </p>
                    <ul className="mt-2.5 space-y-2">
                      {service.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-ink-secondary">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
                      <span className="font-semibold text-ink-secondary">Best for:</span>{" "}
                      {service.bestFor}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Button
                      asChild
                      className="flex-1"
                      variant={service.popular ? "primary" : "outline"}
                    >
                      <Link
                        href={
                          service.slug === "business" ? "/business" : "/customer/delivery/create"
                        }
                      >
                        {service.slug === "business" ? "Talk to sales" : "Book this service"}
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="flex-1">
                      <Link href="/how-it-works">How it works</Link>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Comparison */}
      <Section tone="muted" size="full">
        <SectionHeader
          eyebrow="Compare"
          title="Side-by-side coverage"
          description="The differences that matter when you are deciding how to send."
        />
        <div className="mt-8 sm:mt-10">
          <ComparisonTable
            columns={MARKETING_SERVICES.map((service) => service.title)}
            rows={COMPARISON}
          />
        </div>
        <p className="mt-4 text-center text-xs text-ink-muted">
          Feature availability is illustrative for this demo deployment.
        </p>
      </Section>

      {/* Package sizes */}
      <Section size="full">
        <SectionHeader
          eyebrow="Package sizes"
          title="Small enough for a document, big enough for a move"
          description="Package size and weight decide the vehicle class and the final quote."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-10">
          {[
            {
              icon: Package,
              title: "Documents",
              size: "Envelope · up to 1 kg",
              note: "Rideshare or bike couriers",
            },
            {
              icon: Package,
              title: "Small parcel",
              size: "Shoebox · up to 5 kg",
              note: "Bike or three-wheeler",
            },
            {
              icon: Truck,
              title: "Medium parcel",
              size: "Suitcase · up to 20 kg",
              note: "Van or pickup",
            },
            {
              icon: Sparkles,
              title: "Bulk / multi-box",
              size: "Multiple items",
              note: "Cargo van, business only",
            },
          ].map(({ icon: Icon, title, size, note }) => (
            <li key={title}>
              <Card padding="lg" interactive="hover" className="flex h-full flex-col">
                <span
                  className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-secondary-light text-secondary-dark dark:text-secondary-light"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-secondary">{size}</p>
                <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-muted">
                  <MapPin className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  {note}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <CtaBand
          title="Not sure which service fits?"
          description="Start a booking and the wizard will recommend the cheapest courier that can meet your window."
          primary={{ label: "Get a quote", href: "/customer/delivery/create" }}
          secondary={{ label: "Ask support", href: "/contact" }}
        />
      </Section>
    </>
  );
}
