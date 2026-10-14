"use client";

import * as React from "react";
import Link from "next/link";
import { HelpCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaqAccordion } from "@/components/marketing/blocks";

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export function FaqBrowser({ items }: { items: readonly FaqItem[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");

  const categories = React.useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ["all", ...unique];
  }, [items]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesQuery =
        !needle ||
        item.question.toLowerCase().includes(needle) ||
        item.answer.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [items, category, query]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-5">
      <Card padding="lg" className="flex flex-col gap-4">
        <div className="relative">
          <label htmlFor="faq-search" className="sr-only">
            Search frequently asked questions
          </label>
          <Input
            id="faq-search"
            type="search"
            placeholder="Search questions — e.g. refunds, insurance, tracking…"
            icon={<Search />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pr-10"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1.5">
            {categories.map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className={cn(
                  "rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                  "data-[state=active]:border-primary data-[state=active]:bg-primary-light data-[state=active]:text-primary dark:data-[state=active]:bg-primary/20 dark:data-[state=active]:text-primary-light",
                )}
              >
                {item === "all" ? "All topics" : item}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((item) => (
            <TabsContent key={item} value={item} className="sr-only" />
          ))}
        </Tabs>

        <p className="text-xs text-ink-muted" role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "question" : "questions"}
          {hasQuery ? ` matching “${query.trim()}”` : ""}
        </p>
      </Card>

      {grouped.length === 0 ? (
        <Card padding="lg" className="text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-ink-muted"
            aria-hidden="true"
          >
            <HelpCircle className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-ink">No matching questions</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Try a different word, or send us a message and a human will answer within a few hours.
          </p>
          <Button asChild className="mt-5">
            <Link href="/contact">Contact support</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([group, list]) => (
            <section key={group}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
                {group}
              </h2>
              <Card padding="lg">
                <FaqAccordion
                  items={list.map((item) => ({ question: item.question, answer: item.answer }))}
                  defaultOpen={filtered.length === 1 ? list[0]?.question : undefined}
                />
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
