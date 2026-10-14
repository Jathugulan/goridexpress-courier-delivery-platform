"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PaginationBar({
  page,
  totalPages,
  total,
  label = "results",
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  label?: string;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3 sm:flex-row"
    >
      <p className="text-xs text-ink-muted">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages} ·{" "}
        {formatNumber(total)} {label}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <ul className="flex items-center gap-1">
          {pages.map((entry, index) =>
            entry === null ? (
              <li key={`gap-${index}`} className="px-1 text-xs text-ink-muted" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => onPageChange(entry)}
                  aria-current={entry === page ? "page" : undefined}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    entry === page
                      ? "bg-primary text-white"
                      : "text-ink-secondary hover:bg-muted hover:text-ink",
                  )}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ul>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: (number | null)[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) out.push(null);
    out.push(value);
    previous = value;
  }
  return out;
}
