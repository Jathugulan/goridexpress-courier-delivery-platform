import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Camera,
  CircleDollarSign,
  ClipboardCheck,
  KeyRound,
  MapPin,
  MessageSquare,
  PackageCheck,
  Route,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  Container,
  CtaBand,
  FeatureGrid,
  ProcessSteps,
  Section,
  SectionHeader,
  StatsBand,
  type FeatureItem,
} from "@/components/marketing/blocks";
import { MARKETING_STEPS, MARKETING_STATS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From booking to proof of delivery: see exactly what happens at each step of a GoRideXpress delivery, how couriers are verified and how tracking works.",
  alternates: { canonical: "/how-it-works" },
};

const STEP_DETAIL = [
  {
    title: "Book in under a minute",
    icon: MapPin,
    paragraphs: [
      "Pick a pickup address and a dropoff address — save them once and reuse them later. Then describe the parcel: what it is, how big it is and roughly how much it weighs.",
      "Choose a service level, add notes for the courier and optionally select a scheduled window instead of the earliest available slot.",
    ],
  },
  {
    title: "Review the quote",
    icon: CircleDollarSign,
    paragraphs: [
      "The quote combines the service level, the estimated distance, package size and any extras you selected. Insurance and a scheduled window appear as separate lines so nothing is hidden.",
      "Apply a promo code or spend part of your demo wallet balance, confirm the recipient details, then place the booking.",
    ],
  },
  {
    title: "A courier is assigned",
    icon: UserCheck,
    paragraphs: [
      "The platform matches your job to verified couriers who are nearby and have capacity for that vehicle class. You see the courier's name, rating and vehicle before they arrive.",
      "If the first courier declines or cannot reach the pickup in time, the job is re-dispatched automatically and you are notified.",
    ],
  },
  {
    title: "Pickup is confirmed",
    icon: Camera,
    paragraphs: [
      "The courier captures a pickup photo and the parcel's condition notes. That record timestamps the handover and becomes the first entry in the delivery trail.",
      "The status moves to Picked up and the live map starts showing the courier's position.",
    ],
  },
  {
    title: "Track it live",
    icon: Route,
    paragraphs: [
      "While the delivery is active you can follow the courier on the map, see the distance covered, the remaining ETA and any delay flags.",
      "Recipients can follow the same view without an account using the order ID — useful when someone else is expecting the parcel.",
    ],
  },
  {
    title: "Delivered with proof",
    icon: PackageCheck,
    paragraphs: [
      "At the dropoff the courier records a delivery photo, the recipient's name and an optional signature note. The order closes as Delivered and the trail is frozen.",
      "Receipts and the full trail stay available in your order history, and any issue can be raised straight from the order screen.",
    ],
  },
] as const;

const TRUST_FEATURES: readonly FeatureItem[] = [
  {
    icon: ShieldCheck,
    title: "Identity-verified couriers",
    description:
      "Government ID, background check and vehicle inspection are completed before a courier can accept jobs.",
  },
  {
    icon: Camera,
    title: "Photo proof at both ends",
    description:
      "Pickup and dropoff photos are attached to the order record so disputes can be reviewed quickly.",
  },
  {
    icon: BellRing,
    title: "Status notifications",
    description:
      "In-app and email notifications at assignment, pickup, delay and delivery — you choose what you receive.",
  },
  {
    icon: KeyRound,
    title: "One fixed confirmed price",
    description:
      "The amount you confirm at checkout is the amount on the receipt. Nothing is added at the door.",
  },
  {
    icon: MessageSquare,
    title: "Direct courier contact",
    description:
      "Call or chat with your assigned courier from the order screen, with the notes you added at booking.",
  },
  {
    icon: ClipboardCheck,
    title: "Auditable history",
    description:
      "Every status change, location ping and photo is timestamped and exportable for your records.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Six steps, no phone calls"
        description="The whole delivery runs through the platform — from the moment you place a booking to the proof of delivery that closes it."
        crumbs={[{ label: "Home", href: "/" }, { label: "How it works" }]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/customer/delivery/create">
                Start a booking
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/track">Track a delivery</Link>
            </Button>
          </>
        }
      />

      <Section size="full" className="pt-10 sm:pt-14">
        <SectionHeader
          eyebrow="The flow"
          title="From booking to proof of delivery"
          description="Six stages, each one visible to you in the order timeline."
        />
        <div className="mt-8 sm:mt-10">
          <ProcessSteps steps={MARKETING_STEPS} />
        </div>
      </Section>

      <Section tone="muted" size="full">
        <ol className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          {STEP_DETAIL.map(({ title, icon: Icon, paragraphs }, index) => (
            <li key={title}>
              <Card padding="lg" className="flex h-full gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>
                  <span
                    className="hidden flex-1 w-0.5 bg-line lg:block"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-0.5 text-lg font-semibold text-ink">{title}</h3>
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section size="full">
        <SectionHeader
          eyebrow="Trust"
          title="What keeps a delivery accountable"
          description="Verification, evidence and clear communication — the three things that make on-demand delivery predictable."
        />
        <div className="mt-8 sm:mt-10">
          <FeatureGrid features={TRUST_FEATURES} cols={3} />
        </div>
      </Section>

      <Section tone="muted" size="full">
        <SectionHeader
          eyebrow="Track a delivery"
          title="Follow any order with its ID"
          description="Public tracking shows the status, the live courier position and the estimated arrival without requiring an account."
        />
        <div className="mt-8 sm:mt-10">
          <Card padding="lg" className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
              aria-hidden="true"
            >
              <Search className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-ink">Have an order ID to hand?</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Order IDs look like <span className="font-mono font-semibold">GRX123456</span> and
                appear in your confirmation message, receipt and order history.
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/track">Open the tracker</Link>
            </Button>
          </Card>
        </div>

        <div className="mt-8">
          <StatsBand stats={MARKETING_STATS} />
        </div>
      </Section>

      <Section size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <CtaBand
          title="Ready when you are"
          description="Create an account, save your addresses and book your first delivery in under a minute."
          primary={{ label: "Create free account", href: "/register" }}
          secondary={{ label: "Compare services", href: "/services" }}
        />
        <Container className="mt-6">
          <p className="text-center text-xs text-ink-muted">
            Payments in this deployment are simulated — no real money moves.
          </p>
        </Container>
      </Section>
    </>
  );
}
