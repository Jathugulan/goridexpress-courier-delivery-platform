import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, LifeBuoy, MapPin, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/marketing/blocks";
import { ContactForm, SupportChannels, SupportHoursNote } from "@/components/marketing/contact-form";
import { APP_NAME } from "@/config";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact the GoRideXpress support team by form, email or phone. Get help with a booking, report a problem or talk to us about business deliveries.",
  alternates: { canonical: "/contact" },
};

const QUICK_OPTIONS = [
  {
    icon: MessageCircleQuestion,
    title: "Read the FAQ",
    body: "Most booking, pricing and tracking questions are answered already.",
    href: "/faq",
    cta: "Open FAQ",
  },
  {
    icon: LifeBuoy,
    title: "Help centre",
    body: "Guides for tracking, claims, cancellations and delivery rules.",
    href: "/help",
    cta: "Visit help centre",
  },
  {
    icon: Clock3,
    title: "Track a delivery",
    body: "Check live status and courier location with your order ID.",
    href: "/track",
    cta: "Open tracker",
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to a human"
        description="Support is available around the clock for active deliveries. Send a message and we will reply to your email address."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/faq">
              Browse the FAQ
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <Section size="full" className="pt-10 sm:pt-14">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:gap-8">
          <ContactForm />

          <div className="space-y-5">
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
                Other ways to reach us
              </h2>
              <SupportChannels />
              <SupportHoursNote className="mt-3" />
            </div>

            <Card padding="lg" className="bg-muted/50">
              <span
                className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
                aria-hidden="true"
              >
                <MapPin className="size-5" />
              </span>
              <h2 className="text-sm font-semibold text-ink">Head office</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                No. 24, Fleet Street
                <br />
                Colombo 07, Sri Lanka
              </p>
              <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
                {APP_NAME} is a demo deployment — form submissions are not persisted anywhere.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      <Section tone="muted" size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {QUICK_OPTIONS.map(({ icon: Icon, title, body, href, cta }) => (
            <Card key={title} padding="lg" interactive="hover" className="flex h-full flex-col">
              <span
                className="mb-3.5 flex size-11 items-center justify-center rounded-xl bg-secondary-light text-secondary-dark dark:text-secondary-light"
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <h2 className="text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-muted">{body}</p>
              <Button asChild variant="ghost" size="sm" className="mt-3 self-start px-0">
                <Link href={href}>{cta}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
