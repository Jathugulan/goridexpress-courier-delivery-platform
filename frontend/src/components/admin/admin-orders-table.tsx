"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ban,
  Bike,
  ChevronRight,
  RefreshCw,
  UserPlus,
  X,
} from "lucide-react";
import {
  useAdminOrders,
  useAdminOrderMutations,
  useCourierRecommendations,
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
import { formatCurrency, formatDateTime, formatDistance, formatEta } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea, Field, FieldLabel } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ServiceBadge,
  CourierStatusBadge,
} from "@/components/shared/status";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";

type StatusFilter = "ALL" | "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

const FILTERS: FilterOption<StatusFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_MAP: Record<StatusFilter, string | undefined> = {
  ALL: undefined,
  PENDING: "CREATED,CONFIRMED,COURIER_ASSIGNMENT",
  IN_TRANSIT: "PICKED_UP,IN_TRANSIT,OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

export function AdminOrdersTable() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const [assignTarget, setAssignTarget] = React.useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<string | null>(null);
  const debounced = useDebouncedValue(search);

  React.useEffect(() => {
    setPage(1);
  }, [debounced, status]);

  const params = React.useMemo(
    () => ({
      page,
      limit: 15,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(STATUS_MAP[status] ? { status: STATUS_MAP[status] } : {}),
    }),
    [debounced, page, status],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useAdminOrders(params);
  const { cancel } = useAdminOrderMutations();
  const orders = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search order reference, customer or courier…"
              label="Search orders"
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterChips
              options={FILTERS}
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
        skeleton={<TableLoadingSkeleton rows={8} cols={6} />}
        empty={
          <ListEmptyState
            icon={Ban}
            title="No orders"
            description={
              search || status !== "ALL"
                ? "No orders match the current search or filter."
                : "Customer bookings will appear here in real time."
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
              ) : undefined
            }
          />
        }
      >
        <div className="space-y-2">
          {/* Mobile cards */}
          <ul className="space-y-2 lg:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Card padding="md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-bold text-ink">{order.orderId}</p>
                      <p className="truncate text-[11px] text-ink-muted">{order.customerName}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <ServiceBadge service={order.serviceType} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <Badge variant="neutral" size="sm">
                      {formatCurrency(order.amount)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignTarget(order.id)}
                    >
                      <UserPlus className="size-3.5" aria-hidden="true" />
                      Assign
                    </Button>
                    {!["DELIVERED", "CANCELLED"].includes(order.status) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelTarget(order.id)}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        Cancel
                      </Button>
                    ) : null}
                    <Button asChild variant="ghost" size="sm" className="ml-auto">
                      <Link href={`/customer/orders/${order.id}`}>
                        Details
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <Card padding="none" className="hidden overflow-hidden lg:block">
            <ResponsiveTable
              ariaLabel="Orders"
              headers={[
                { label: "Order" },
                { label: "Customer" },
                { label: "Status" },
                { label: "Service" },
                { label: "Amount", align: "right" },
                { label: "Courier" },
                { label: "Actions", align: "right" },
              ]}
            >
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-primary">
                        {order.orderId}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block truncate text-sm text-ink">{order.customerName}</span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {order.customerPhone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <ServiceBadge service={order.serviceType} />
                    </TableCell>
                    <TableCell align="right">
                      <span className="block text-sm font-semibold text-ink">
                        {formatCurrency(order.amount)}
                      </span>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      {order.courier ? (
                        <span className="block truncate text-sm text-ink">
                          {order.courier.firstName} {order.courier.lastName}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignTarget(order.id)}
                        >
                          <UserPlus className="size-3.5" aria-hidden="true" />
                          Assign
                        </Button>
                        {!["DELIVERED", "CANCELLED"].includes(order.status) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelTarget(order.id)}
                          >
                            <X className="size-3.5" aria-hidden="true" />
                            Cancel
                          </Button>
                        ) : null}
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            href={`/customer/orders/${order.id}`}
                            aria-label={`View order ${order.orderId}`}
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
        </div>
      </DataState>

      {data ? (
        <PaginationBar
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          label="orders"
          onPageChange={setPage}
        />
      ) : null}

      <AssignCourierDialog
        orderId={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => setAssignTarget(null)}
      />

      <CancelDialog
        orderId={cancelTarget}
        pending={cancel.isPending}
        onClose={() => setCancelTarget(null)}
        onConfirm={(reason) =>
          cancel.mutate(
            { id: cancelTarget as string, reason },
            { onSuccess: () => setCancelTarget(null) },
          )
        }
      />
    </div>
  );
}

function AssignCourierDialog({
  orderId,
  onClose,
  onAssigned,
}: {
  orderId: string | null;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const { data, isPending } = useCourierRecommendations(orderId ?? undefined, Boolean(orderId));
  const { assignCourier } = useAdminOrderMutations();

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a courier</DialogTitle>
          <DialogDescription>
            Recommendations are ranked by distance, rating and current load.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <TableLoadingSkeleton rows={3} cols={2} />
        ) : !data?.length ? (
          <p className="text-sm text-ink-muted">No courier recommendations available.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((rec) => {
              const busy = rec.courier.status !== "ONLINE";
              return (
                <li
                  key={rec.courier.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {rec.courier.firstName} {rec.courier.lastName}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {formatDistance(rec.distanceKm)} · {formatEta(rec.etaMinutes)} ·{" "}
                      {rec.courier.rating?.toFixed(1)}★
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-muted">{rec.reason}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CourierStatusBadge status={rec.courier.status} />
                    <Button
                      type="button"
                      size="sm"
                      disabled={assignCourier.isPending || busy}
                      onClick={() =>
                        assignCourier.mutate(
                          { id: orderId as string, courierId: rec.courier.id },
                          { onSuccess: onAssigned },
                        )
                      }
                    >
                      <Bike className="size-3.5" aria-hidden="true" />
                      Assign
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({
  orderId,
  pending,
  onClose,
  onConfirm,
}: {
  orderId: string | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(orderId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>
            The customer and assigned courier are notified. Any demo payment is refunded.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="admin-cancel-reason">Reason</FieldLabel>
          <Textarea
            id="admin-cancel-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Customer unreachable, address outside service area"
          />
        </Field>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep order
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={() => onConfirm(reason.trim() || "Cancelled by operations")}
          >
            Cancel order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

