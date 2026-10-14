import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  FileSpreadsheet,
  Headset,
  Layers,
  Percent,
  Rocket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CtaBand, FaqAccordion, Section, SectionHeader } from "@/components/marketing/blocks";
import { BUSINESS_BENEFITS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Business & bulk deliveries",
  description:
    "Scheduled routes, team seats, monthly invoicing and analytics for businesses moving parcels at volume with GoRideXpress.",
  alternates: { canonical: "/business" },
};

const PLANS = [
  {
    name: "Starter",
    price: "Pay per delivery",
    period: "No commitment",
    description: "For a single founder or a small team that just needs reliable same-day delivery.",
    features: [
      "Business account with saved addresses",
      "Scheduled delivery windows",
      "Email notifications for every job",
      "CSV export of delivery records",
      "Email support",
    ],
    cta: "Create a business account",
    href: "/register",
    featured: false,
  },
  {
    name: "Team",
    price: "$199",
    period: "per month",
    description: "For operations teams running regular volume who need seats, analytics and faster support.",
    features: [
      "Everything in Starter",
      "Up to 10 team seats",
      "Scheduled and recurring routes",
      "Spend, volume and turnaround analytics",
      "Priority support line",
      "Monthly consolidated invoicing",
    ],
    cta: "Start with Team",
    href: "/contact",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual agreement",
    description: "For high-volume shippers who need negotiated rates and an API in their stack.",
    features: [
      "Everything in Team",
      "Unlimited seats and custom roles",
      "Negotiated per-kilometre rates",
      "API access and webhooks",
      "Dedicated account manager",
      "Custom SLAs and reporting",
    ],
    cta: "Talk to sales",
    href: "/contact",
    featured: false,
  },
] as const;

const BENEFIT_ICONS = [
  CalendarClock,
  Users,
  FileSpreadsheet,
  BarChart3,
  Headset,
  Layers,
] as const;

const BUSINESS_FAQS = [
  {
    question: "How does bulk pricing work?",
    answer:
      "Business plans quote per kilometre with volume bands, so the more you ship consistently the lower the effective rate. Scheduled routes are quoted per stop.",
  },
  {
    question: "Can multiple people book on one account?",
    answer:
      "Yes. Team and Enterprise plans include seats with roles, so an operations lead can approve bookings while colleagues create them.",
  },
  {
    question: "Do you support multi-stop routes?",
    answer:
      "Yes. A single booking can contain multiple pickups and dropoffs, which keeps them on one courier route and one invoice line.",
  },
  {
    question: "How does invoicing work?",
    answer:
      "Monthly consolidated statements list every delivery, the service used and the agreed rate. Statements and delivery records export as CSV for your finance system.",
  },
  {
    question: "Is there an API?",
    answer:
      "API access and webhooks are part of Enterprise and planned for the next release. Contact us to register interest and get the sandbox documentation.",
  },
  {
    question: "Can we get support outside business hours?",
    answer:
      "Yes. Every plan has access to the support channel, and Team and Enterprise plans get a priority line with response targets during operating hours.",
  },
] as const;

export default function BusinessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Delivery for teams that send every day"
        description="Scheduled routes, team seats, consolidated invoicing and analytics — so operations stops living in spreadsheets and phone calls."
        crumbs={[{ label: "Home", href: "/" }, { label: "Business" }]}
        badge={{ label: "Volume pricing available", tone: "success" }}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/contact">
                Talk to sales
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See delivery rates</Link>
            </Button>
          </>
        }
      />

      {/* Benefits */}
      <Section size="full" className="pt-10 sm:pt-14">
        <SectionHeader
          eyebrow="Built for volume"
          title="Everything a busy operation needs"
          description="The same tracking and proof-of-delivery experience, plus the controls finance and operations ask for."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:mt-10">
          {BUSINESS_BENEFITS.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? Rocket;
            return (
              <li key={benefit.title}>
                <Card padding="lg" interactive="hover" className="flex h-full">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{benefit.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                      {benefit.description}
                    </p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Plans */}
      <Section tone="muted" size="full" id="plans">
        <SectionHeader
          eyebrow="Plans"
          title="Pick the plan that matches your volume"
          description="Start pay-per-delivery and move to a monthly plan once regular volume makes it worthwhile."
        />
        <ul className="mt-8 grid gap-5 lg:grid-cols-3 sm:mt-10">
          {PLANS.map((plan) => (
            <li key={plan.name} className="h-full">
              <Card
                padding="lg"
                elevation={plan.featured ? "elevated" : "card"}
                className={`relative flex h-full flex-col ${plan.featured ? "border-primary/40 ring-1 ring-primary/20" : ""}`}
              >
                {plan.featured ? (
                  <Badge variant="primary" size="sm" className="absolute -top-2.5 left-5">
                    Most popular
                  </Badge>
                ) : null}

                <h3 className="text-base font-bold text-ink">{plan.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">
                  {plan.description}
                </p>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black tabular-nums text-ink">{plan.price}</span>
                    {plan.period ? (
                      <span className="text-xs text-ink-muted">{plan.period}</span>
                    ) : null}
                  </p>
                </div>

                <ul className="mt-4 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-secondary">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-5 w-full"
                  variant={plan.featured ? "primary" : "outline"}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-muted">
          <Percent className="size-3.5" aria-hidden="true" />
          All business plan prices are illustrative in this demo deployment.
        </p>
      </Section>

      {/* Use cases */}
      <Section size="full">
        <SectionHeader
          eyebrow="Use cases"
          title="Who uses GoRideXpress for business"
          description="Common patterns from teams shipping every day."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-10">
          {[
            {
              title: "Retail stores",
              body: "Same-day handovers to customers and stock transfers between branches.",
            },
            {
              title: "E-commerce",
              body: "Order-to-door delivery with tracking links you can send straight to buyers.",
            },
            {
              title: "Pharmacies",
              body: "Urgent prescription and equipment deliveries with priority handling.",
            },
            {
              title: "Workshops",
              body: "Parts, samples and tools moved between sites on a fixed schedule.",
            },
          ].map((item) => (
            <li key={item.title}>
              <Card padding="lg" className="h-full">
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{item.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section tone="muted" size="full">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            title="Business questions"
            description="The commercial details teams usually check before signing up."
            action={
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/contact">Ask something else</Link>
              </Button>
            }
            className="items-start"
          />
          <FaqAccordion items={BUSINESS_FAQS} defaultOpen={BUSINESS_FAQS[0].question} />
        </div>
      </Section>

      <Section size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <CtaBand
          title="Let's talk about your volume"
          description="Tell us how much you ship and where, and we will come back with a plan and a rate card that fits."
          primary={{ label: "Contact sales", href: "/contact" }}
          secondary={{ label: "Create an account", href: "/register" }}
        />
      </Section>
    </>
  );
}
