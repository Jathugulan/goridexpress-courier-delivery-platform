"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, ChevronRight, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useAdminCustomers, useAdminCustomerBlock } from "@/hooks/admin-queries";
import {
  useDebouncedValue,
  SearchInput,
  DataState,
  ListEmptyState,
  TableLoadingSkeleton,
} from "@/components/shared/filters";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel, Textarea } from "@/components/ui/input";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";
import { RatingStars } from "@/components/shared/status";

export function AdminCustomersPanel() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [blockTarget, setBlockTarget] = React.useState<{ id: string; name: string } | null>(null);
  const debounced = useDebouncedValue(search);

  React.useEffect(() => {
    setPage(1);
  }, [debounced]);

  const params = React.useMemo(
    () => ({ page, limit: 12, ...(debounced.trim() ? { search: debounced.trim() } : {}) }),
    [debounced, page],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useAdminCustomers(params);
  const { block, unblock } = useAdminCustomerBlock();
  const customers = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Customers" value={customers.length} icon={Users} tone="primary" />
        <StatCard
          label="Blocked"
          value={customers.filter((c) => c.isBlocked).length}
          icon={Ban}
          tone={customers.some((c) => c.isBlocked) ? "warning" : "success"}
        />
        <StatCard
          label="Verified"
          value={customers.filter((c) => c.isVerified).length}
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email or phone…"
              label="Search customers"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh customers"
          >
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={customers.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={6} cols={5} />}
        empty={
          <ListEmptyState
            icon={Users}
            title="No customers"
            description="Registered customers appear here once they sign up."
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Customers"
            headers={[
              { label: "Customer" },
              { label: "Contact" },
              { label: "Orders" },
              { label: "Spent", align: "right" },
              { label: "Joined" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <span className="block truncate text-sm font-semibold text-ink">
                      {customer.firstName} {customer.lastName}
                    </span>
                    {customer.isBlocked ? (
                      <Badge variant="error" size="sm">
                        Blocked
                      </Badge>
                    ) : customer.isVerified ? (
                      <Badge variant="success" size="sm">
                        Verified
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-xs text-ink">{customer.email}</span>
                    <span className="block truncate text-[11px] text-ink-muted">
                      {customer.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-ink">
                      {customer.totalOrders ?? 0}
                    </span>
                    {customer.totalOrders ? (
                      <RatingStars value={customer.rating ?? 0} count={customer.totalOrders} size="xs" />
                    ) : null}
                  </TableCell>
                  <TableCell align="right">
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(customer.totalSpent ?? 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">{formatDate(customer.createdAt)}</span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-1.5">
                      {customer.isBlocked ? (
                        <Button
                          type="button"
                          size="sm"
                          loading={unblock.isPending}
                          onClick={() => unblock.mutate(customer.id)}
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setBlockTarget({
                              id: customer.id,
                              name: `${customer.firstName} ${customer.lastName}`,
                            })
                          }
                        >
                          Block
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          aria-label={`View ${customer.firstName} ${customer.lastName}`}
                        >
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
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
          label="customers"
          onPageChange={setPage}
        />
      ) : null}

      <BlockDialog
        target={blockTarget}
        pending={block.isPending}
        onClose={() => setBlockTarget(null)}
        onConfirm={(reason) =>
          block.mutate(
            { id: blockTarget?.id as string, reason },
            { onSuccess: () => setBlockTarget(null) },
          )
        }
      />
    </div>
  );
}

function BlockDialog({
  target,
  pending,
  onClose,
  onConfirm,
}: {
  target: { id: string; name: string } | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Block {target?.name}?</DialogTitle>
          <DialogDescription>
            They will not be able to sign in or place new deliveries.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="block-reason">Reason</FieldLabel>
          <Textarea
            id="block-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Repeated address misdirection"
          />
        </Field>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={() => onConfirm(reason.trim() || "Blocked by operations")}
          >
            Block customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
