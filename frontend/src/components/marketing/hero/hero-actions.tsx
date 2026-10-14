"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HERO_ACTIONS } from "@/content/hero";
import { HeroReveal } from "./motion";

/* -------------------------------------------------------------------------- */
/*                                   Actions                                  */
/* -------------------------------------------------------------------------- */

export interface HeroActionsProps {
  className?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/**
 * The two hero calls to action.
 *
 * Both render as links, so they are real navigation targets rather than click
 * handlers — middle-click, open-in-new-tab and keyboard activation all behave
 * natively.
 *
 * Geometry is the brief's: 52px tall, 12px radius, 24px horizontal padding, and
 * a 16px gap between the two. The primary lifts 2px on hover with a matching
 * deeper blue; the secondary keeps a flat surface and shifts to blue text and
 * border instead. Both sit edge to edge on tablet and above, and stack full width
 * below `sm`, which is where the 42/58 split does not exist and full-width
 * targets are easier to hit.
 */
export function HeroActions({
  className,
  primary = HERO_ACTIONS.primary,
  secondary = HERO_ACTIONS.secondary,
}: HeroActionsProps) {
  return (
    <HeroReveal className={cn("w-full", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button
          asChild
          size="lg"
          className={cn(
            "h-13 w-full rounded-xl px-6 font-semibold",
            "shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)]",
            "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-8px_rgba(37,99,235,0.6)]",
            "sm:w-auto",
          )}
        >
          <Link href={primary.href}>
            {primary.label}
            <ArrowRight className="size-[18px]" aria-hidden="true" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className={cn(
            "h-13 w-full rounded-xl border-line-strong bg-card px-6 font-semibold text-ink",
            "hover:border-primary hover:bg-app-bg hover:text-primary",
            "sm:w-auto",
          )}
        >
          <Link href={secondary.href}>
            <Search className="size-[18px]" aria-hidden="true" />
            {secondary.label}
          </Link>
        </Button>
      </div>
    </HeroReveal>
  );
}
