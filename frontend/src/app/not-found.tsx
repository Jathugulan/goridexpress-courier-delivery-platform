import Link from "next/link";
import { Compass, Home, LifeBuoy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/blocks";

const SUGGESTIONS = [
  { label: "Track a delivery", href: "/track" },
  { label: "Compare services", href: "/services" },
  { label: "See pricing", href: "/pricing" },
  { label: "Help centre", href: "/help" },
] as const;

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center bg-app-bg">
      <Container size="narrow">
        <div className="py-16 text-center">
          <span
            className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
            aria-hidden="true"
          >
            <Compass className="size-8" />
          </span>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Error 404</p>
          <h1 className="mt-3 text-balance text-3xl font-black tracking-tight text-ink sm:text-4xl">
            We could not find that page
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-base leading-relaxed text-ink-muted">
            The link may be broken, or the page may have moved. Try one of the shortcuts below or
            head back to the homepage.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                <Home aria-hidden="true" />
                Back to homepage
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">
                <LifeBuoy aria-hidden="true" />
                Contact support
              </Link>
            </Button>
          </div>

          <div className="mt-10 border-t border-line pt-8">
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <Search className="size-3.5" aria-hidden="true" />
              Popular destinations
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {SUGGESTIONS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}
