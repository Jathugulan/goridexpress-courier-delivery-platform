import * as React from "react";
import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*                               Support strip                                */
/* -------------------------------------------------------------------------- */

export function SupportStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[100rem] flex-col items-start gap-3 rounded-2xl border border-line bg-card px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
          aria-hidden="true"
        >
          <PhoneCall className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Need help right now?</p>
          <p className="text-xs text-ink-muted">Our support team replies in minutes, 24/7.</p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
        <Link href="/help">Open help centre</Link>
      </Button>
    </div>
  );
}
