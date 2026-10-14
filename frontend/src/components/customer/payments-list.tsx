"use client";

import * as React from "react";
import { Clock3, ReceiptIndianRupee, RefreshCw, Wallet } from "lucide-react";
import { usePayments, usePaymentStats } from "@/hooks/queries";
import { useDebouncedValue } from "@/components/shared/filters";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/cards";
import { DataState, ListEmptyState, StatsLoadingSkeleton } from "@/components/shared/filters";
import { PaymentRow } from "@/components/shared/cards";
import { PaginationBar } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/filters";
import { ScrollText } from "lucide-react";

export function PaymentsList() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debounced = useDebouncedValue(search);

  React.useEffect(() => {
    setPage(1);
  }, [debounced]);

  const params = React.useMemo(
    () => ({ page, limit: 10, ...(debounced.trim() ? { search: debounced.trim() } : {}) }),
    [debounced, page],
  );

  const { data, isPending, isError, error, refetch, isFetching } = usePayments(params);
  const { data: stats } = usePaymentStats();
  const payments = data?.items ?? [];

  return (
    <div className="space-y-5">
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Demo revenue"
            value={formatCurrency(stats.demoRevenue)}
            hint="Simulated, not real"
            icon={ReceiptIndianRupee}
            tone="primary"
          />
          <StatCard
            label="Today"
            value={formatCurrency(stats.demoRevenueToday)}
            icon={Wallet}
            tone="info"
          />
          <StatCard label="Transactions" value={stats.totalTransactions} icon={ReceiptIndianRupee} />
          <StatCard
            label="Pending"
            value={stats.pending}
            hint="Including COD"
            icon={Clock3}
            tone={stats.pending > 0 ? "warning" : "info"}
          />
        </div>
      ) : (
        <StatsLoadingSkeleton count={4} />
      )}

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by transaction or order reference…"
              label="Search payments"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh payments"
          >
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={payments.length === 0}
        onRetry={() => void refetch()}
        skeleton={
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </Card>
            ))}
          </div>
        }
        empty={
          <ListEmptyState
            icon={ScrollText}
            title="No payments yet"
            description="Completed demo payments appear here with downloadable receipts."
            action={
              <Button asChild variant="outline">
                <a href="/customer/delivery/create">Book a delivery</a>
              </Button>
            }
          />
        }
      >
        <div className="space-y-2">
          {payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </div>
      </DataState>

      {data ? (
        <PaginationBar
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          label="payments"
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
