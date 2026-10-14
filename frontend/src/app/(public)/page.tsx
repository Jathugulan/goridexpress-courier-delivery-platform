import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock3,
  FileText,
  MapPin,
  Package,
  ReceiptIndianRupee,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CtaBand,
  FaqAccordion,
  FeatureGrid,
  ProcessSteps,
  Section,
  SectionHeader,
  ServiceCards,
  StatsBand,
  Testimonials,
} from "@/components/marketing/blocks";
import { HeroSection } from "@/components/marketing/hero";
import { SupportStrip } from "@/components/marketing/support-strip";
import {
  LIVE_DELIVERY_COUNT,
  MARKETING_FAQS,
  MARKETING_FEATURES,
  MARKETING_SERVICES,
  MARKETING_STATS,
  MARKETING_STEPS,
  MARKETING_TESTIMONIALS,
} from "@/content/marketing";

export const metadata: Metadata = {
  title: "On-demand couriers, dispatched in minutes",
  description:
    "Book a verified courier for parcels, errands or bulk business deliveries. Instant quotes, live GPS tracking, digital proof of delivery and demo-simulated payments.",
  alternates: { canonical: "/" },
};

const HIGHLIGHT_FAQS = MARKETING_FAQS.filter((faq) =>
  ["How fast can a courier be dispatched?", "How are prices calculated?", "Are the payments real?", "Can I track without an account?"].includes(
    faq.question,
  ),
);

const PRICING_TILES = [
  { icon: Package, title: "Base fare", value: "$3.49", note: "Covers the first 2 km" },
  { icon: TrendingUp, title: "Per extra km", value: "$0.85", note: "Calculated before you book" },
  {
    icon: Clock3,
    title: "Priority uplift",
    value: "+$2.50",
    note: "Express 90-minute window",
  },
  {
    icon: Wallet,
    title: "Wallet discount",
    value: "10%",
    note: "Paid from your demo balance",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <Section size="marketing" className="pt-10 sm:pt-12" as="div">
        <SupportStrip />
      </Section>

      <Section id="services" size="marketing" className="pt-0 sm:pt-8">
        <SectionHeader
          eyebrow="Services"
          title="A courier for every kind of delivery"
          description="Pick the service that fits, get an instant quote and follow the delivery live."
          action={
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/services">All services</Link>
            </Button>
          }
        />
        <div className="mt-8 sm:mt-10">
          <ServiceCards
            items={MARKETING_SERVICES.map((service) => ({
              icon: service.icon,
              title: service.title,
              description: service.tagline,
              price: service.price,
              eta: service.eta,
              href: service.slug === "business" ? "/business" : "/customer/delivery/create",
              featured: service.popular,
            }))}
          />
        </div>
      </Section>

      <Section tone="muted" size="marketing">
        <SectionHeader
          eyebrow="Why GoRideXpress"
          title="Delivery built around certainty"
          description="Everything you need to know where your parcel is, what it costs and who is carrying it."
        />
        <div className="mt-8 sm:mt-10">
          <FeatureGrid features={MARKETING_FEATURES} cols={4} />
        </div>
      </Section>

      <Section size="marketing">
        <SectionHeader
          eyebrow="How it works"
          title="Four steps from booking to doorstep"
          description="No calls, no haggling, no surprises — the whole flow happens in the app."
        />
        <div className="mt-8 sm:mt-10">
          <ProcessSteps steps={MARKETING_STEPS} />
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/how-it-works">See the full walkthrough</Link>
          </Button>
        </div>
      </Section>

      <Section size="marketing">
        <SectionHeader
          eyebrow="Live right now"
          title="Deliveries moving across the city"
          description="A snapshot of active jobs in the demo environment."
        />
        <div className="mt-8 sm:mt-10">
          <StatsBand stats={MARKETING_STATS} />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" size="lg">
            <Link href="/track">
              <MapPin aria-hidden="true" />
              Track a live delivery
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/services">
              <FileText aria-hidden="true" />
              Compare services
            </Link>
          </Button>
        </div>
      </Section>

      <Section tone="muted" size="marketing">
        <SectionHeader
          eyebrow="Customers"
          title="Trusted by senders every week"
          description="Teams and individuals who moved their deliveries onto GoRideXpress."
        />
        <div className="mt-8 sm:mt-10">
          <Testimonials items={MARKETING_TESTIMONIALS} />
        </div>
      </Section>

      <Section size="marketing">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <SectionHeader
            align="left"
            eyebrow="Pricing"
            title="Transparent pricing, no hidden fees"
            description="Every quote shows the service level, distance and extras before you confirm. Business plans add scheduled routes and monthly billing."
            action={
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/pricing">Full pricing details</Link>
              </Button>
            }
            className="items-start"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {PRICING_TILES.map(({ icon: Icon, title, value, note }) => (
              <div
                key={title}
                className="rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow hover:shadow-elevated"
              >
                <span
                  className="mb-3 flex size-10 items-center justify-center rounded-xl bg-secondary-light text-secondary-dark dark:text-secondary-light"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-ink">{value}</p>
                <p className="mt-1 text-xs text-ink-muted">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-card p-6 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
              aria-hidden="true"
            >
              <ReceiptIndianRupee className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">How the quote is built</p>
              <p className="mt-0.5 max-w-xl text-sm text-ink-muted">
                Service level + distance + package size + optional extras. The amount you confirm is
                the amount on your demo receipt.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full sm:mt-0 sm:w-auto">
            <Link href="/pricing">See the formula</Link>
          </Button>
        </div>
      </Section>

      <Section tone="muted" size="marketing" id="faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            description="The things senders ask us most. Something missing? The help centre has the rest."
            action={
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/faq">All FAQs</Link>
              </Button>
            }
            className="items-start"
          />
          <FaqAccordion
            items={HIGHLIGHT_FAQS.map((faq) => ({ question: faq.question, answer: faq.answer }))}
            defaultOpen={HIGHLIGHT_FAQS[0].question}
          />
        </div>
      </Section>

      <Section size="marketing" className="pb-16 sm:pb-20 lg:pb-24">
        <CtaBand
          title="Ready to send something anywhere in the city?"
          description="Create a free account, book a courier in under a minute and follow them live from pickup to doorstep."
          primary={{ label: "Send a parcel", href: "/customer/delivery/create" }}
          secondary={{ label: "Create free account", href: "/register" }}
        />
        <p className="mt-6 text-center text-xs text-ink-muted">
          {LIVE_DELIVERY_COUNT} demo deliveries are active right now · Payments are simulated
        </p>
      </Section>
    </>
  );
}
