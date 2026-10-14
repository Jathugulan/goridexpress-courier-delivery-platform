import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Calculator,
  CircleHelp,
  Clock3,
  Info,
  Route,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { FaqAccordion, Section, SectionHeader } from "@/components/marketing/blocks";
import { DemoNotice, PriceRow, PriceTotal, PromotionCallout } from "@/components/shared/pricing";
import { CtaBand } from "@/components/marketing/blocks";
import {
  HANDLING_FEE_FRAGILE,
  INSURANCE_RATE_PER_KG,
  MAX_WEIGHT_KG,
  PRIORITY_FEE,
  SERVICE_FEE,
  SERVICE_RATES,
  TAX_RATE,
} from "@/lib/pricing";
import { formatCurrency, formatEta } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "See GoRideXpress delivery rates: base fare per service, per-kilometre cost, optional insurance, priority and fragile handling fees. All payments in this demo are simulated.",
  alternates: { canonical: "/pricing" },
};

const PRICING_FAQS = [
  {
    question: "Are the payments real?",
    answer:
      "No. Card, wallet and mobile payments are simulated in this deployment and no real money ever moves. Every receipt is stamped as a demo transaction.",
  },
  {
    question: "How is my final price calculated?",
    answer:
      "Base fare for the chosen service, plus a per-kilometre rate for the estimated distance, plus any extras you selected (priority, insurance, fragile handling). The service fee is shown as its own line.",
  },
  {
    question: "What does the per-kilometre rate cover?",
    answer:
      "It covers the travel from pickup to dropoff, calculated as the road distance estimate. Very short urban hops still pay the base fare only.",
  },
  {
    question: "Can I cancel before pickup?",
    answer:
      "Yes. Cancelling before the courier is assigned refunds the full amount to the original payment method. After pickup, a cancellation fee may apply and is shown before you confirm.",
  },
  {
    question: "Do you charge a booking fee?",
    answer:
      "There is a small per-delivery service fee shown as a separate line at checkout. It covers payment processing, support and platform operations.",
  },
  {
    question: "Do prices change with demand?",
    answer:
      "No surge pricing. The quote you see is the price you pay, and it is locked in once you confirm the booking.",
  },
] as const;

const EXAMPLE = {
  distanceKm: 6.4,
  weightKg: 3,
  service: SERVICE_RATES[0],
  insurance: true,
  fragile: true,
};

function exampleBreakdown() {
  const { service, distanceKm, weightKg, insurance, fragile } = EXAMPLE;
  const distanceFee = Number((distanceKm * service.pricePerKm).toFixed(2));
  const insuranceFee = insurance
    ? Number((weightKg * INSURANCE_RATE_PER_KG).toFixed(2))
    : 0;
  const fragileFee = fragile ? HANDLING_FEE_FRAGILE : 0;
  const subtotal = service.basePrice + distanceFee + insuranceFee + fragileFee + SERVICE_FEE;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));

  return {
    lines: [
      { label: `${service.name} — base fare`, amount: service.basePrice },
      { label: "Distance", hint: `${distanceKm} km × ${formatCurrency(service.pricePerKm)}`, amount: distanceFee },
      ...(insuranceFee
        ? [{ label: "Parcel insurance", hint: `${weightKg} kg`, amount: insuranceFee }]
        : []),
      ...(fragileFee ? [{ label: "Fragile handling", amount: fragileFee }] : []),
      { label: "Service fee", amount: SERVICE_FEE },
    ],
    tax,
    total: Number((subtotal + tax).toFixed(2)),
  };
}

export default function PricingPage() {
  const example = exampleBreakdown();

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Straightforward rates, no surge pricing"
        description="Pick a service, see the base fare and the per-kilometre rate, then add only the extras you actually want. The confirmed price is what you pay."
        crumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
        badge={{ label: "Simulated payments", tone: "warning" }}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/customer/delivery/create">
                Get an exact quote
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">Pricing FAQs</Link>
            </Button>
          </>
        }
      />

      {/* Rate cards */}
      <Section size="full" className="pt-10 sm:pt-14">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_RATES.map((service) => (
            <li key={service.code} className="h-full">
              <Card
                padding="lg"
                interactive="hover"
                elevation={service.popular ? "elevated" : "card"}
                className="relative flex h-full flex-col"
              >
                {service.popular ? (
                  <Badge variant="primary" size="sm" className="absolute -top-2.5 left-5">
                    Most booked
                  </Badge>
                ) : null}

                <h2 className="text-base font-semibold text-ink">{service.name}</h2>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">
                  {service.description}
                </p>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tabular-nums text-ink">
                      {formatCurrency(service.basePrice)}
                    </span>
                    <span className="text-xs text-ink-muted">base fare</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    + {formatCurrency(service.pricePerKm)} per km
                  </p>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-ink-secondary">
                  <li className="flex items-center gap-2">
                    <Clock3 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {formatEta(service.estimatedMinutes)} typical
                  </li>
                  <li className="flex items-center gap-2">
                    <Truck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {service.vehicleType.replaceAll("_", " ").toLowerCase()}
                  </li>
                </ul>

                <Button
                  asChild
                  size="sm"
                  variant={service.popular ? "primary" : "outline"}
                  className="mt-5 w-full"
                >
                  <Link href="/customer/delivery/create">Book {service.name}</Link>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* Worked example */}
      <Section tone="muted" size="full">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Worked example"
              title="What an instant delivery costs"
              description="A 6.4 km instant delivery for a 3 kg parcel with insurance and fragile handling. Here is every line that makes up the total."
            />

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: Route,
                  title: "Distance-based",
                  body: "Per-kilometre rate on the estimated road distance, capped by the service tier.",
                },
                {
                  icon: Scale,
                  title: "Size aware",
                  body: "Bulky items can be charged on volumetric weight rather than actual weight.",
                },
                {
                  icon: ShieldCheck,
                  title: "Optional insurance",
                  body: "Priced per kilogram, only when you ask for cover on the parcel.",
                },
                {
                  icon: Sparkles,
                  title: "No surge",
                  body: "The quote is locked when you confirm — demand never changes it later.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-line bg-card p-4 shadow-card"
                >
                  <span
                    className="mb-2.5 flex size-9 items-center justify-center rounded-lg bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>

          <Card padding="lg" elevation="elevated" className="h-fit">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-ink">Price breakdown</h2>
            </div>

            <div className="mt-4 divide-y divide-line">
              {example.lines.map((line) => (
                <PriceRow
                  key={line.label}
                  label={line.label}
                  hint={line.hint}
                  amount={line.amount}
                />
              ))}
            </div>

            <div className="mt-3 border-t-2 border-dashed border-line pt-3">
              {example.tax > 0 ? <PriceRow label="Tax" amount={example.tax} /> : null}
              <PriceTotal label="Total to pay" amount={example.total} />
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning-light/50 p-3 text-xs leading-relaxed text-warning-dark dark:text-warning-light">
              <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
              <p>
                Illustration only. Your actual quote is calculated at checkout from the addresses and
                package you enter, and no payment is ever taken in this demo.
              </p>
            </div>

            <Button asChild className="mt-4 w-full">
              <Link href="/customer/delivery/create">Calculate my exact price</Link>
            </Button>
          </Card>
        </div>
      </Section>

      {/* Extras */}
      <Section size="full">
        <SectionHeader
          eyebrow="Extras"
          title="Optional add-ons, priced up front"
          description="These are the only additions to a quote. You see the cost before confirming and can remove any of them."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-10">
          {[
            {
              icon: ShieldCheck,
              title: "Parcel insurance",
              price: `${formatCurrency(INSURANCE_RATE_PER_KG)} / kg`,
              note: "Covers loss or damage up to a declared value.",
            },
            {
              icon: Sparkles,
              title: "Priority handling",
              price: formatCurrency(PRIORITY_FEE),
              note: "Moves your job to the front of the dispatch queue.",
            },
            {
              icon: Boxes,
              title: "Fragile handling",
              price: formatCurrency(HANDLING_FEE_FRAGILE),
              note: "Extra care, slower handling and a careful drop.",
            },
            {
              icon: CircleHelp,
              title: "Service fee",
              price: formatCurrency(SERVICE_FEE),
              note: "Flat platform fee covering payments and support.",
            },
          ].map(({ icon: Icon, title, price, note }) => (
            <li key={title}>
              <Card padding="lg" className="flex h-full flex-col">
                <span
                  className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-secondary-light text-secondary-dark dark:text-secondary-light"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm font-bold tabular-nums text-primary">{price}</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{note}</p>
              </Card>
            </li>
          ))}
        </ul>

        <p className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
          <Scale className="size-4" aria-hidden="true" />
          Parcels up to {MAX_WEIGHT_KG} kg per delivery. Heavier or multi-stop shipments need a
          business plan.
        </p>
      </Section>

      {/* Promo */}
      <Section tone="muted" size="full">
        <div className="grid gap-5 lg:grid-cols-2">
          <PromotionCallout
            title="10% off your first three deliveries"
            description="New accounts receive demo coupons they can apply at checkout. Coupons stack with wallet payments but never with another coupon."
            code="GRXNEW10"
          />
          <Card padding="lg" className="flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                aria-hidden="true"
              >
                <BadgePercent className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-ink">Business pricing</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Scheduled routes, monthly invoicing, team seats and negotiated per-kilometre
                  rates for regular volume.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/business">See business plans</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section size="full">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            title="Pricing questions"
            description="If something is still unclear, the help centre covers refunds, claims and delivery rules in more detail."
            action={
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/help">Open help centre</Link>
              </Button>
            }
            className="items-start"
          />
          <FaqAccordion items={PRICING_FAQS} defaultOpen={PRICING_FAQS[0].question} />
        </div>
        <DemoNotice className="mt-8 justify-center" />
      </Section>

      <Section size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <CtaBand
          title="Check your own price in seconds"
          description="Enter the pickup, dropoff and package details and the booking wizard shows the exact quote before you commit."
          primary={{ label: "Get an exact quote", href: "/customer/delivery/create" }}
          secondary={{ label: "Compare services", href: "/services" }}
        />
      </Section>
    </>
  );
}
