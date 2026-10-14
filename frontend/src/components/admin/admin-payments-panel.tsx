"use client";

import * as React from "react";
import { BanknoteArrowDown, RefreshCw, RotateCcw, Wallet as WalletIcon } from "lucide-react";
import {
  useAdminPayments,
  useAdminPaymentStats,
  useAdminPaymentMutations,
} from "@/hooks/admin-queries";
import {
  useDebouncedValue,
  SearchInput,
  FilterChips,
  DataState,
  ListEmptyState,
  TableLoadingSkeleton,
  type FilterOption,
} from "@/components/shared/filters";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";
import { PaymentStatusBadge, PaymentMethodBadge, DemoTag } from "@/components/shared/status";

type PayFilter = "ALL" | "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

const FILTERS: FilterOption<PayFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export function AdminPaymentsPanel() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<PayFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const [refundTarget, setRefundTarget] = React.useState<string | null>(null);
  const debounced = useDebouncedValue(search);

  React.useEffect(() => {
    setPage(1);
  }, [debounced, status]);

  const params = React.useMemo(
    () => ({
      page,
      limit: 12,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(status !== "ALL" ? { status } : {}),
    }),
    [debounced, page, status],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useAdminPayments(params);
  const { data: stats } = useAdminPaymentStats();
    const { refund } = useAdminPaymentMutations();
  const payments = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary-light/40 p-3 text-xs text-ink-muted dark:bg-primary/5">
        <DemoTag />
        All transactions below are simulated demo records. No real funds are moved.
      </div>

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Successful"
            value={formatCurrency(stats.demoRevenue ?? 0)}
            hint={`${formatCurrency(stats.demoRevenueToday ?? 0)} today`}
            icon={WalletIcon}
            tone="success"
          />
          <StatCard
            label="Pending"
            value={stats.pending ?? 0}
            icon={RotateCcw}
            tone="warning"
          />
          <StatCard label="Failed" value={stats.failed ?? 0} icon={RotateCcw} tone="error" />
          <StatCard
            label="COD pending"
            value={stats.codPending ?? 0}
            hint={`${formatCurrency(stats.demoRevenueToday ?? 0)} collected today`}
            icon={BanknoteArrowDown}
            tone="info"
          />
        </div>
      ) : null}

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by order reference or customer…"
              label="Search payments"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              options={FILTERS}
              label="Payment status"
              allLabel="All"
              value={status}
              onChange={(next) => setStatus(next as PayFilter)}
            />
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
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={payments.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={6} cols={6} />}
        empty={
          <ListEmptyState
            icon={WalletIcon}
            title="No payments"
            description="Demo payment records appear here as customers check out."
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Payments"
            headers={[
              { label: "Order" },
              { label: "Customer" },
              { label: "Method" },
              { label: "Status" },
              { label: "Amount", align: "right" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <span className="block font-mono text-xs font-bold text-primary">
                      {payment.orderId}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      {formatDateTime(payment.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-sm text-ink">
                      {payment.customerName ?? "—"}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-ink-muted">
                      {payment.transactionId ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PaymentMethodBadge method={payment.method} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell align="right">
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(payment.amount)}
                    </span>
                    {payment.refundAmount ? (
                      <span className="block text-[11px] text-ink-muted">
                        -{formatCurrency(payment.refundAmount)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">
                    {payment.status === "PAID" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRefundTarget(payment.id)}
                      >
                        Refund
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        </Card>
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

      <RefundDialog
        paymentId={refundTarget}
        pending={refund.isPending}
        onClose={() => setRefundTarget(null)}
        onConfirm={(amount, reason) =>
          refund.mutate(
            { id: refundTarget as string, payload: { amount, reason } },
            { onSuccess: () => setRefundTarget(null) },
          )
        }
      />
    </div>
  );
}

function RefundDialog({
  paymentId,
  pending,
  onClose,
  onConfirm,
}: {
  paymentId: string | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(paymentId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue a demo refund</DialogTitle>
          <DialogDescription>
            Leave the amount blank to refund the full transaction. The customer wallet is credited
            instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field>
            <FieldLabel htmlFor="refund-amount">Amount (optional)</FieldLabel>
            <Input
              id="refund-amount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Full amount"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="refund-reason">Reason</FieldLabel>
            <Input
              id="refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Delivery failed"
            />
          </Field>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={() =>
              onConfirm(
                amount.trim() ? Number(amount) : 0,
                reason.trim() || "Refund issued by operations",
              )
            }
          >
            Refund
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
