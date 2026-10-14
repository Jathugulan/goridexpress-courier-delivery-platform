import * as React from "react";
import Link from "next/link";
import {
  AtSign,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Rss,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { PUBLIC_FOOTER_SECTIONS } from "@/constants/design";
import { APP_DESCRIPTION, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/config";

const SOCIALS = [
  { label: "Community", href: "https://example.com/community", icon: MessageCircle },
  { label: "Updates", href: "https://example.com/updates", icon: Rss },
  { label: "Networks", href: "https://example.com/networks", icon: Share2 },
  { label: "Website", href: "https://example.com", icon: Globe },
] as const;

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified couriers" },
  { icon: Clock, label: "24/7 booking" },
  { icon: MapPin, label: "Live GPS tracking" },
] as const;

export function PublicFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("mt-auto border-t border-line bg-card", className)}>
      {/* Trust strip */}
      <div className="border-b border-line bg-muted/40">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <p key={label} className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </p>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[100rem] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_2.6fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">{APP_DESCRIPTION}</p>

            <ul className="mt-5 space-y-2.5 text-sm text-ink-secondary">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href={`tel:${SUPPORT_PHONE.replace(/[^+\d]/g, "")}`} className="hover:text-primary">
                  {SUPPORT_PHONE}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Colombo, Sri Lanka · Serving 25+ districts</span>
              </li>
            </ul>

            <ul className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`GoRideXpress — ${label}`}
                    className="flex size-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:gap-8">
            {PUBLIC_FOOTER_SECTIONS.map((section) => (
              <nav key={section.title} aria-label={section.title}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                  {section.title}
                </h2>
                <ul className="mt-3.5 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-muted transition-colors hover:text-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-3 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-xs text-ink-muted">
            © {year} GoRideXpress. All rights reserved.
          </p>
          <p className="text-xs text-ink-muted">
            Demo platform — payments are simulated. Built with Next.js, NestJS and Socket.IO.
          </p>
        </div>
      </div>
    </footer>
  );
}
