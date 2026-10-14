import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy, MessageCircleQuestion, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/marketing/blocks";
import { FaqBrowser } from "@/components/marketing/faq-browser";
import { MARKETING_FAQS } from "@/content/marketing";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/config";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about booking, pricing, payments, tracking, couriers and business plans on GoRideXpress — searchable and grouped by topic.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description="Booking, pricing, payments, tracking and couriers — grouped so you can find the answer quickly."
        crumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/help">
                <LifeBuoy aria-hidden="true" />
                Help centre
              </Link>
            </Button>
            <Button asChild>
              <Link href="/contact">
                <MessageCircleQuestion aria-hidden="true" />
                Ask a question
              </Link>
            </Button>
          </>
        }
      />

      <Section size="full" className="pt-10 sm:pt-14">
        <div className="mx-auto w-full max-w-4xl">
          <FaqBrowser items={MARKETING_FAQS} />
        </div>
      </Section>

      <Section tone="muted" size="full" className="pb-16 sm:pb-20 lg:pb-24">
        <div className="mx-auto w-full max-w-4xl">
          <Card padding="lg" className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
              aria-hidden="true"
            >
              <Phone className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-ink">Still stuck?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Support is available 24/7 at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                or{" "}
                <a href={`tel:${SUPPORT_PHONE}`} className="font-medium text-primary hover:underline">
                  {SUPPORT_PHONE}
                </a>
                .
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/contact">
                Contact us
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Card>
        </div>
      </Section>
    </>
  );
}
