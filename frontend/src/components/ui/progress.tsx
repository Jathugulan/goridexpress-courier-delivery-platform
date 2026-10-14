"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import type { Pagination } from "@/types";

/* -------------------------------------------------------------------------- */
/*                                 Pagination                                */
/* -------------------------------------------------------------------------- */

export function buildPageList(current: number, total: number, siblings = 1): (number | "gap")[] {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total]);
  for (let i = current - siblings; i <= current + siblings; i += 1) {
    if (i > 0 && i <= total) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) out.push("gap");
    out.push(page);
    prev = page;
  }
  return out;
}

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50],
  className,
  itemLabel = "results",
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
  itemLabel?: string;
}) {
  const { page, limit, total, totalPages, hasNext, hasPrevious } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs text-ink-muted" role="status" aria-live="polite">
          Showing <span className="font-semibold text-ink">{from}</span>–
          <span className="font-semibold text-ink">{to}</span> of{" "}
          <span className="font-semibold text-ink">{total}</span> {itemLabel}
        </p>
        {onLimitChange ? (
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="whitespace-nowrap">Rows</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-line-strong bg-input px-2 text-xs font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!hasPrevious}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "hidden sm:inline-flex",
          )}
          aria-label="Go to first page"
        >
          <ChevronsLeft />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Go to previous page"
        >
          <ChevronLeft />
        </button>

        <ul className="mx-1 flex items-center gap-1">
          {buildPageList(page, totalPages).map((item, i) =>
            item === "gap" ? (
              <li key={`gap-${i}`} className="px-1 text-xs text-ink-disabled" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? "page" : undefined}
                  aria-label={`Go to page ${item}`}
                  className={cn(
                    "size-9 rounded-lg text-sm font-semibold transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    item === page
                      ? "bg-primary text-white shadow-sm"
                      : "text-ink-secondary hover:bg-muted hover:text-ink",
                  )}
                >
                  <span className="sr-only">
                    {item === page ? `Page ${item}, current page` : `Page ${item}`}
                  </span>
                  <span aria-hidden="true">{item}</span>
                </button>
              </li>
            ),
          )}
        </ul>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          aria-label="Go to next page"
        >
          <ChevronRight />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "hidden sm:inline-flex",
          )}
          aria-label="Go to last page"
        >
          <ChevronsRight />
        </button>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Progress                                 */
/* -------------------------------------------------------------------------- */

export function Progress({
  value,
  className,
  tone = "primary",
  size = "md",
  label,
  showValue,
  animated = true,
}: {
  value: number;
  className?: string;
  tone?: "primary" | "success" | "warning" | "error" | "secondary";
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  animated?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const bar = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  }[tone];
  const height = { sm: "h-1.5", md: "h-2", lg: "h-3" }[size];

  return (
    <div className={cn("w-full", className)}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label ? <span className="text-xs font-medium text-ink-secondary">{label}</span> : null}
          {showValue ? (
            <span className="text-xs font-semibold tabular-nums text-ink">{Math.round(pct)}%</span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={cn("w-full overflow-hidden rounded-full bg-muted", height)}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            bar,
            animated && "bg-[length:24px_24px] bg-[linear-gradient(45deg,rgba(255,255,255,0.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.22)_75%,transparent_75%)] bg-[animation:progress-stripes_1s_linear_infinite]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Meter                                    */
/* -------------------------------------------------------------------------- */

export function Meter({
  value,
  max = 100,
  className,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Meter"}
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-secondary">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
