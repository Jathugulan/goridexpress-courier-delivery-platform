"use client";

import * as React from "react";
import { Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import {
  ErrorState,
  EmptyState,
  NetworkErrorState,
  type EmptyStateProps,
} from "@/components/ui/states";
import { ApiError } from "@/lib/api/envelope";
import { errorMessage } from "@/hooks/queries";
import type { LucideIcon } from "lucide-react";

/* ======================================================================== */
/*                             Debounced search                              */
/* ======================================================================== */

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/* ======================================================================== */
/*                               Search input                                */
/* ======================================================================== */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        icon={<Search />}
        className="[&::-webkit-search-cancel-button]:hidden"
        suffix={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Clear search"
              className="rounded-md p-1 text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null
        }
      />
    </div>
  );
}

/* ======================================================================== */
/*                               Filter chips                                */
/* ======================================================================== */

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  allLabel = "All",
}: {
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  allLabel?: string;
}) {
  const items = [{ value: "ALL" as T, label: allLabel }, ...options];

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex snap-x gap-2 overflow-x-auto pb-1 scrollbar-none", className)}
    >
      {items.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              active
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-line-strong bg-card text-ink-secondary hover:border-primary/40 hover:bg-primary-light hover:text-primary-dark dark:hover:text-primary-light",
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                  active ? "bg-white/20" : "bg-muted text-ink-muted",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ======================================================================== */
/*                            Filter toolbar shell                           */
/* ======================================================================== */

export function FilterBar({
  children,
  onReset,
  isFiltered,
  className,
}: {
  children: React.ReactNode;
  onReset?: () => void;
  isFiltered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-line bg-card p-3 shadow-card sm:p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
      {isFiltered && onReset ? (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Filter className="size-3.5" aria-hidden="true" />
            Filters applied
          </p>
          <Button size="xs" variant="ghost" onClick={onReset} leftIcon={<X />}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                          Active filter summary                            */
/* ======================================================================== */

export function ActiveFilters({
  filters,
  onRemove,
  onClear,
  className,
}: {
  filters: { key: string; label: string; value: string }[];
  onRemove: (key: string) => void;
  onClear?: () => void;
  className?: string;
}) {
  if (filters.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((filter) => (
        <Badge key={filter.key} variant="neutral" size="sm" className="gap-1 pr-1">
          <span className="text-ink-muted">{filter.label}:</span>
          <span className="font-semibold text-ink">{filter.value}</span>
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            aria-label={`Remove ${filter.label} filter ${filter.value}`}
            className="ml-0.5 rounded p-0.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
      {onClear && filters.length > 1 ? (
        <Button size="xs" variant="link" onClick={onClear}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}

/* ======================================================================== */
/*                              Query state shell                            */
/* ======================================================================== */

export interface DataStateProps {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  onRetry?: () => void;
  skeleton?: React.ReactNode;
  empty?: React.ReactNode;
  children: React.ReactNode;
  /** Hide the empty state even when there are no rows (e.g. custom layout). */
  suppressEmpty?: boolean;
}

/**
 * Renders exactly one of: skeleton → error → empty → content.
 * Keeps every list page consistent and guarantees an accessible status at all times.
 */
export function DataState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  skeleton,
  empty,
  children,
  suppressEmpty,
}: DataStateProps) {
  if (isLoading) {
    return <>{skeleton ?? <Skeleton className="h-40 w-full rounded-2xl" />}</>;
  }

  if (error) {
    if (error instanceof ApiError && error.isNetwork) {
      return <NetworkErrorState onRetry={onRetry} />;
    }
    return <ErrorState description={errorMessage(error)} onRetry={onRetry} />;
  }

  if (isEmpty && !suppressEmpty) {
    return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  }

  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*                          Table loading skeleton                            */
/* -------------------------------------------------------------------------- */

export function TableLoadingSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return <SkeletonTable rows={rows} cols={cols} />;
}

/* -------------------------------------------------------------------------- */
/*                            List empty state                               */
/* -------------------------------------------------------------------------- */

export function ListEmptyState(props: EmptyStateProps) {
  return <EmptyState {...props} />;
}

/* -------------------------------------------------------------------------- */
/*                                Stat skeleton                               */
/* -------------------------------------------------------------------------- */

export function StatsLoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <Skeleton className="mb-3 size-10 rounded-xl" />
          <Skeleton className="mb-2 h-7 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Section heading                               */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
  className,
  as: Tag = "h2",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4";
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
          <Tag className="text-base font-semibold text-ink sm:text-lg">{title}</Tag>
        </div>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
