"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { HeaderActions, MobileAuthCta } from "./user-menu";
import { PUBLIC_NAV_LINKS } from "@/constants/design";
import { useAuthStore } from "@/store/auth-store";

/* -------------------------------------------------------------------------- */
/*                              Active link helper                            */
/* -------------------------------------------------------------------------- */

function useIsActive() {
  const pathname = usePathname();
  return React.useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Desktop nav                                */
/* -------------------------------------------------------------------------- */

function DesktopNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Main navigation" className="hidden min-[1200px]:block">
      <ul className="flex items-center gap-1">
        {PUBLIC_NAV_LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active ? "text-primary" : "text-ink-secondary hover:bg-muted hover:text-ink",
                )}
              >
                {link.label}
                {active ? (
                  <span
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Header utilities                              */
/* -------------------------------------------------------------------------- */

/**
 * Book-a-delivery CTA.
 *
 * Not on the bar itself — the hero owns the primary booking action, and the
 * brief's visual priority puts "Book a Delivery" directly under the heading
 * rather than in the chrome. This is the sheet's version, full width, for
 * viewports where the bar shows no inline links.
 */
function BookDeliveryCta({ className }: { className?: string }) {
  return (
    <Button
      asChild
      size="md"
      className={cn("h-11 rounded-[10px] px-4 font-semibold shadow-sm hover:shadow-card", className)}
    >
      <Link href="/customer/delivery/create">
        Book a Delivery
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Mobile menu                                */
/* -------------------------------------------------------------------------- */

function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const isActive = useIsActive();
  const user = useAuthStore((s) => s.user);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <IconButton label="Open navigation menu" className="min-[1200px]:hidden">
          <Menu />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
        <SheetHeader className="border-b border-line px-5 py-4">
          <SheetTitle className="text-left">
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-1 p-3">
          <nav aria-label="Mobile navigation">
            <ul className="flex flex-col gap-0.5">
              {PUBLIC_NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active
                          ? "bg-primary-light text-primary-dark dark:text-primary-light"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="text-sm font-semibold">{link.label}</span>
                      <span className="text-xs text-ink-muted">{link.description}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="my-2 h-px bg-line" aria-hidden="true" />

          <ul className="flex flex-col gap-0.5">
            {[
              { label: "How It Works", href: "/how-it-works" },
              { label: "Pricing", href: "/pricing" },
              { label: "FAQs", href: "/faq" },
              { label: "For Business", href: "/business" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3 pt-4">
            {user ? (
              <>
                <Button asChild variant="outline" size="md" onClick={() => setOpen(false)}>
                  <Link href={user.role === "ADMIN" ? "/admin" : "/customer/dashboard"}>
                    Go to dashboard
                  </Link>
                </Button>
                <BookDeliveryCta className="w-full" />
              </>
            ) : (
              <>
                <BookDeliveryCta className="w-full" />
                <MobileAuthCta />
              </>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Public header                               */
/* -------------------------------------------------------------------------- */

/**
 * Marketing site navigation.
 *
 * A fixed 76px bar on a white surface with a single hairline underneath — the
 * home hero sits directly below it, so the two share one horizontal edge at
 * 1440px.
 *
 * ### What is deliberately not here
 *
 * There is no "Book a Delivery" button and no standalone "Login" link. Booking
 * belongs to the hero, which is where the brief's visual priority puts it, and
 * the sign-in path already exists once per bar via `HeaderActions` → `UserMenu`
 * (a "Sign in" link when signed out, the avatar menu when signed in) — a second
 * copy of Login beside it was a duplicate control pointing at the same route.
 * Both actions remain full-width buttons at the foot of the nav sheet.
 *
 * ### Why the links wait until 1200px
 *
 * With the action cluster reduced to search, theme toggle and the account menu,
 * the bar measures ~940px with the five inline links included. That clears the
 * ~1136px available at 1200px but not the ~704px available at 768px, so between
 * `lg` and 1200px the bar keeps the logo and actions and the links move into the
 * sheet rather than being squeezed.
 */
export function PublicHeader({ className }: { className?: string }) {
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-line bg-card transition-shadow duration-200",
        scrolled && "shadow-sm",
        className,
      )}
    >
      <div className="mx-auto flex h-[76px] w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 min-[1200px]:gap-5 min-[1200px]:px-8">
        <Logo />

        <div className="mx-1 hidden h-8 w-px bg-line min-[1200px]:block" aria-hidden="true" />

        <DesktopNav />

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="hidden lg:inline-flex"
            aria-label="Track a delivery"
          >
            <Link href="/track" aria-current={pathname === "/track" ? "page" : undefined}>
              <Search />
            </Link>
          </Button>

          <ThemeToggle />
          <HeaderActions />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
