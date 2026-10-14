"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PackagePlus, RefreshCw } from "lucide-react";
import { useOrders } from "@/hooks/queries";
import { useDebouncedValue } from "@/components/shared/filters";
import { SearchInput, FilterChips, DataState, ListEmptyState, type FilterOption } from "@/components/shared/filters";
import { OrderCard } from "@/components/shared/cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/shared/pagination";
import { PackageX } from "lucide-react";

type StatusFilter = "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED";

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "ALL", label: "All orders" },
  { value: "ACTIVE", label: "In progress" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ACTIVE_STATUSES = ["CREATED", "PAYMENT_PENDING", "CONFIRMED", "COURIER_ASSIGNMENT", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"];

export function OrdersList() {
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");
  const [status, setStatus] = React.useState<StatusFilter>(
    (searchParams.get("status") as StatusFilter) ?? "ALL",
  );
  const [page, setPage] = React.useState(1);
  const debounced = useDebouncedValue(search);

  React.useEffect(() => {
    setPage(1);
  }, [debounced, status]);

  const params = React.useMemo(
    () => ({
      page,
      limit: 10,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(status !== "ALL"
        ? { status: status === "ACTIVE" ? ACTIVE_STATUSES.join(",") : status }
        : {}),
    }),
    [debounced, page, status],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useOrders(params);
  const orders = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by order reference, address or courier…"
              label="Search orders"
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterChips
              options={STATUS_OPTIONS}
              label="Order status"
              allLabel="All"
              value={status}
              onChange={(next) => setStatus(next as StatusFilter)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh orders"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={orders.length === 0}
        onRetry={() => void refetch()}
        skeleton={
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted" />
              </Card>
            ))}
          </div>
        }
        empty={
          <ListEmptyState
            icon={PackageX}
            title="No orders found"
            description={
              search || status !== "ALL"
                ? "Try a different search or filter."
                : "Your booked deliveries will appear here."
            }
            action={
              search || status !== "ALL" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatus("ALL");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <a href="/customer/delivery/create">
                    <PackagePlus className="size-4" aria-hidden="true" />
                    Book a delivery
                  </a>
                </Button>
              )
            }
          />
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </DataState>

      {total > 0 ? (
        <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
