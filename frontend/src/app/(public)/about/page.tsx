import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  Leaf,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CtaBand, Section, SectionHeader, StatsBand, Testimonials } from "@/components/marketing/blocks";
import { MARKETING_STATS, MARKETING_TESTIMONIALS } from "@/content/marketing";

export const metadata: Metadata = {
  title: "About us",
  description:
    "GoRideXpress is an on-demand courier platform built around one idea: a delivery should be easy to book, easy to follow and easy to trust. Learn about our story and values.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Target,
    title: "Certainty over speed",
    description:
      "Fast is only useful if it is predictable. We design every screen so you know the status, the ETA and the price without guessing.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability by default",
    description:
      "Verified couriers, photo proof at both ends and a timestamped trail on every job. Trust is a feature, not a promise in fine print.",
  },
  {
    icon: HeartHandshake,
    title: "Fair for both sides",
    description:
      "Transparent pricing for senders and transparent earnings for couriers, so the marketplace stays healthy long term.",
  },
  {
    icon: Leaf,
    title: "Lighter footprint",
    description:
      "Consolidated routes and efficient dispatch reduce empty miles across the city for every delivery we handle.",
  },
] as const;

const TIMELINE = [
  {
    year: "2023",
    title: "The problem",
    body: "A small courier team was losing hours every day to phone calls, missed handovers and quotes that changed at the door.",
  },
  {
    year: "2024",
    title: "First dispatch",
    body: "We launched a booking flow with instant quotes, assigned couriers in minutes and a shared live map for every active job.",
  },
  {
    year: "2025",
    title: "Growing the network",
    body: "Coverage expanded across 25 districts with scheduled routes, business accounts and courier earnings dashboards.",
  },
  {
    year: "Today",
    title: "Platform for teams",
    body: "Senders get one place to book, track, pay and export records — with support that answers within minutes.",
  },
] as const;

const TEAM = [
  {
    name: "Amaya Perera",
    role: "Head of Product",
    bio: "Spent a decade in logistics operations before deciding the tools were the problem, not the couriers.",
  },
  {
    name: "Rohan de Silva",
    role: "Engineering Lead",
    bio: "Builds the dispatch and tracking stack. Believes a status a customer cannot understand is a bug.",
  },
  {
    name: "Shanika Wijesinghe",
    role: "Courier Operations",
    bio: "Runs courier onboarding and support. First person to call when an ETA slips.",
  },
  {
    name: "Marcus Bennett",
    role: "Business Accounts",
    bio: "Works with retail and e-commerce teams migrating their delivery volume onto the platform.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="We make on-demand delivery feel dependable"
        description="GoRideXpress connects people who need something moved with verified couriers who can move it well — with a booking flow and tracking experience designed for clarity."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/customer/delivery/create">
                Send a parcel
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/business">Business with us</Link>
            </Button>
          </>
        }
      />

      {/* Mission */}
      <Section size="full" className="pt-10 sm:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Why we exist"
              title="A courier marketplace that behaves like a utility"
              description="Booking a courier should take less time than arguing about the fee. We obsessed over the parts of delivery that normally go wrong: unclear prices, silent couriers, missing proof and zero visibility."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-secondary">
              <p>
                We started with a single insight — most delivery problems are communication
                problems wearing a logistics costume. When the price is shown before you confirm, the
                courier is named before they arrive, and every handoff is recorded, disputes become
                rare instead of routine.
              </p>
              <p>
                Today the platform handles everything from a single document across town to daily
                bulk routes for retail teams, with the same promise in each case: you know what it
                costs, who is carrying it and exactly when it will arrive.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <Card key={title} padding="lg" interactive="hover" className="h-full">
                <span
                  className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Journey */}
      <Section tone="muted" size="full">
        <SectionHeader
          eyebrow="Journey"
          title="How GoRideXpress got here"
          description="From a frustrated ops team to a platform used every day across the city."
        />
        <ol className="mt-8 space-y-4 sm:mt-10">
          {TIMELINE.map((entry, index) => (
            <li key={entry.year}>
              <Card padding="lg" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex items-center gap-3 sm:w-32 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1">
                  <span className="text-sm font-black tabular-nums text-primary">{entry.year}</span>
                  {index < TIMELINE.length - 1 ? (
                    <span
                      className="h-6 w-0.5 bg-line sm:h-8"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-ink">{entry.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{entry.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      {/* Numbers */}
      <Section size="full">
        <SectionHeader
          eyebrow="By the numbers"
          title="Where we are today"
          description="Illustrative figures for this deployment."
        />
        <div className="mt-8 sm:mt-10">
          <StatsBand stats={MARKETING_STATS} />
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPinned, title: "25+ districts", note: "Metro and suburban coverage" },
            { icon: Users, title: "1,240 couriers", note: "All identity-verified" },
            { icon: Compass, title: "24 min", note: "Average pickup time" },
          ].map(({ icon: Icon, title, note }) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary-light text-secondary-dark dark:text-secondary-light"
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="truncate text-xs text-ink-muted">{note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Team */}
      <Section tone="muted" size="full">
        <SectionHeader
          eyebrow="Team"
          title="The people behind the platform"
          description="A small team split between dispatch, engineering and courier operations."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:mt-10">
          {TEAM.map((person) => (
            <li key={person.name}>
              <Card padding="lg" interactive="hover" className="flex h-full flex-col">
                <span
                  className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <h3 className="mt-3.5 text-sm font-semibold text-ink">{person.name}</h3>
                <p className="text-xs font-medium text-primary">{person.role}</p>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">{person.bio}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* Testimonials */}
      <Section size="full">
        <SectionHeader
          eyebrow="Customers"
          title="What senders say"
          description="Feedback that shaped the product we run today."
        />
        <div className="mt-8 sm:mt-10">
          <Testimonials items={MARKETING_TESTIMONIALS} />
        </div>
      </Section>

      <Section size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <CtaBand
          title="Come and see for yourself"
          description="Book a delivery and follow it live — the whole flow takes about a minute to start."
          primary={{ label: "Send a parcel", href: "/customer/delivery/create" }}
          secondary={{ label: "Read the FAQ", href: "/faq" }}
        />
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Payments are simulated in this deployment.
        </p>
      </Section>
    </>
  );
}
