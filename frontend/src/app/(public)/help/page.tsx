import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Camera,
  CircleHelp,
  CreditCard,
  FileWarning,
  LifeBuoy,
  MapPin,
  PackageSearch,
  RefreshCcw,
  Route,
  ShieldQuestion,
  Truck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { FaqAccordion, Section, SectionHeader } from "@/components/marketing/blocks";
import { QuickTrackWidget } from "@/components/marketing/quick-track-widget";
import { FAQS } from "@/content/help";

export const metadata: Metadata = {
  title: "Help centre",
  description:
    "Guides for tracking deliveries, understanding charges, claims and refunds, courier questions and account settings on GoRideXpress.",
  alternates: { canonical: "/help" },
};

const CATEGORIES = [
  {
    icon: Route,
    title: "Tracking & delivery",
    body: "Follow a parcel live, understand each status and what to do when an ETA slips.",
    articles: [
      "How to track an order with or without an account",
      "What each delivery status means",
      "Why my ETA keeps moving",
      "My parcel says out for delivery but has not arrived",
    ],
  },
  {
    icon: CreditCard,
    title: "Charges & payments",
    body: "How quotes are built, what the extra fees are and how demo payments behave.",
    articles: [
      "How the delivery price is calculated",
      "Understanding insurance and fragile handling",
      "Which payment methods can I use?",
      "Why was my demo payment declined?",
    ],
  },
  {
    icon: FileWarning,
    title: "Claims & refunds",
    body: "Report damage, request a refund or escalate a delivery that went wrong.",
    articles: [
      "How to report a damaged or missing parcel",
      "Requesting a refund for a cancelled delivery",
      "What evidence should I attach to a claim?",
      "How long a refund takes to appear",
    ],
  },
  {
    icon: Truck,
    title: "Couriers & handover",
    body: "Identity checks, contact options and what to do if a courier cannot complete a drop.",
    articles: [
      "How are couriers verified?",
      "Contacting my assigned courier",
      "What if nobody is available at the dropoff",
      "Pickup photos and condition notes",
    ],
  },
  {
    icon: PackageSearch,
    title: "Parcels & items",
    body: "Size limits, weight limits, restricted items and how to describe your parcel.",
    articles: [
      "Parcel size and weight limits",
      "Items we cannot carry",
      "Describing fragile or perishable items",
      "Multi-box and bulk shipments",
    ],
  },
  {
    icon: UserCheck,
    title: "Account & security",
    body: "Managing your profile, addresses, sessions, notifications and privacy.",
    articles: [
      "Updating my address book",
      "Signing out of other devices",
      "Choosing which notifications I receive",
      "Deleting my account",
    ],
  },
] as const;

const POPULAR = [
  {
    question: "How do I track a delivery without signing in?",
    answer:
      "Open the tracker and enter the order ID from your confirmation message. Public tracking shows the status, live position, courier details and ETA without revealing addresses or contact numbers.",
  },
  {
    question: "My delivery is late. What should I do?",
    answer:
      "Check the order screen first — a delay flag appears there with a reason such as traffic or a failed pickup attempt. If the new ETA is not acceptable, contact support with your order ID and we will re-dispatch where possible.",
  },
  {
    question: "How do I report a damaged parcel?",
    answer:
      "Open the order, choose Report a problem and describe what happened. The pickup and dropoff photos are attached automatically, which usually means no extra evidence is needed.",
  },
  {
    question: "Can I change the dropoff address after booking?",
    answer:
      "Yes, while the courier has not yet picked up. Open the order and use Edit address. After pickup the change has to be arranged directly with the courier and may affect the price.",
  },
  {
    question: "Why can I not see my delivery in the list?",
    answer:
      "The list shows the most recent orders first. Use the search box with the order ID, or the status filter, to narrow it down. Orders from a different account will not appear.",
  },
  {
    question: "How do promo codes work?",
    answer:
      "Enter the code in the coupon field during checkout to see the discount applied before you confirm. One coupon per booking, and coupons cannot be combined with another offer.",
  },
] as const;

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help centre"
        title="How can we help?"
        description="Guides for every part of the delivery journey, from booking a parcel to chasing a refund."
        crumbs={[{ label: "Home", href: "/" }, { label: "Help" }]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/contact">
                Contact support
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">Browse the FAQ</Link>
            </Button>
          </>
        }
      />

      {/* Quick tracker */}
      <Section size="full" className="pt-10 sm:pt-14">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Fastest fix"
              title="Track a delivery right now"
              description="Most questions start here. Enter the order ID and see exactly where the parcel is and when it should arrive."
            />
            <ul className="mt-5 space-y-2.5">
              {[
                "Order IDs look like GRX123456",
                "You can find it in your confirmation email or receipt",
                "No sign-in needed for public tracking",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink-secondary">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <QuickTrackWidget />
        </div>
      </Section>

      {/* Categories */}
      <Section tone="muted" size="full">
        <SectionHeader
          eyebrow="Guides"
          title="Browse by topic"
          description="Six areas that cover almost every question we get."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:mt-10">
          {CATEGORIES.map(({ icon: Icon, title, body, articles }) => (
            <li key={title}>
              <Card padding="lg" interactive="hover" className="flex h-full flex-col">
                <span
                  className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{body}</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
                  {articles.map((article) => (
                    <li key={article} className="flex items-start gap-2 text-xs text-ink-secondary">
                      <CircleHelp
                        className="mt-0.5 size-3.5 shrink-0 text-ink-disabled"
                        aria-hidden="true"
                      />
                      {article}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* Popular articles */}
      <Section size="full">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <SectionHeader
            align="left"
            eyebrow="Popular"
            title="Most-read answers"
            description="The five things people ask support about most often."
            action={
              <Button asChild variant="ghost" className="mt-4">
                <Link href="/faq">See every FAQ</Link>
              </Button>
            }
            className="items-start"
          />
          <Card padding="lg">
            <FaqAccordion items={POPULAR} defaultOpen={POPULAR[0].question} />
          </Card>
        </div>
      </Section>

      {/* Rules */}
      <Section tone="muted" size="full">
        <SectionHeader
          eyebrow="Good to know"
          title="Delivery rules in plain language"
          description="The things that cause the most friction when they are not obvious."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-10">
          {[
            {
              icon: Ban,
              title: "Restricted items",
              body: "No hazardous materials, cash, perishables without insulation or counterfeit goods.",
            },
            {
              icon: Camera,
              title: "Photo evidence",
              body: "Pickup and dropoff photos are captured automatically and stored on the order.",
            },
            {
              icon: Wallet,
              title: "Demo payments",
              body: "All payment methods are simulated in this deployment. No real money moves.",
            },
            {
              icon: RefreshCcw,
              title: "Re-dispatch",
              body: "If a courier cannot complete a job it is automatically re-assigned to another rider.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Card padding="lg" className="h-full">
                <span
                  className="mb-3 flex size-10 items-center justify-center rounded-xl bg-secondary-light text-secondary-dark dark:text-secondary-light"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <Card padding="lg" className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
            aria-hidden="true"
          >
            <ShieldQuestion className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-ink">Could not find your answer?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Support replies to every message, usually within a few hours — and immediately for
              deliveries that are active right now.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild>
              <Link href="/contact">Contact support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/business">
                <LifeBuoy aria-hidden="true" />
                Business help
              </Link>
            </Button>
          </div>
        </Card>
      </Section>
    </>
  );
}
