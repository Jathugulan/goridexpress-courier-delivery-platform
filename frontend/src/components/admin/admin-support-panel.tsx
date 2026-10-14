"use client";

import * as React from "react";
import { CheckCheck, LifeBuoy, RefreshCw } from "lucide-react";
import { useAdminTickets, useAdminTicketMutations } from "@/hooks/admin-queries";
import {
  useDebouncedValue,
  SearchInput,
  FilterChips,
  DataState,
  ListEmptyState,
  TableLoadingSkeleton,
  type FilterOption,
} from "@/components/shared/filters";
import { formatDateTime, formatRelative } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";
import { TicketStatusBadge } from "@/components/shared/status";
import { useAuthStore } from "@/store/auth-store";

type TicketFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

const FILTERS: FilterOption<TicketFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
];

export function AdminSupportPanel() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TicketFilter>("ALL");
  const [page, setPage] = React.useState(1);
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

  const { data, isPending, isError, error, refetch, isFetching } = useAdminTickets(params);
  const { update } = useAdminTicketMutations();
  const adminId = useAuthStore((s) => s.user?.id);
  const tickets = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Tickets" value={tickets.length} icon={LifeBuoy} tone="primary" />
        <StatCard
          label="Open"
          value={tickets.filter((t) => t.status === "OPEN").length}
          icon={LifeBuoy}
          tone={tickets.some((t) => t.status === "OPEN") ? "warning" : "success"}
        />
        <StatCard
          label="Resolved"
          value={tickets.filter((t) => t.status === "RESOLVED").length}
          icon={CheckCheck}
          tone="success"
        />
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search subject, customer or order…"
              label="Search tickets"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              options={FILTERS}
              label="Ticket status"
              allLabel="All"
              value={status}
              onChange={(next) => setStatus(next as TicketFilter)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh tickets"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={tickets.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={6} cols={5} />}
        empty={
          <ListEmptyState
            icon={CheckCheck}
            title="Queue is clear"
            description="No support tickets match the current filters."
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Support tickets"
            headers={[
              { label: "Ticket" },
              { label: "Customer" },
              { label: "Priority" },
              { label: "Status" },
              { label: "Updated" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <span className="block max-w-[16rem] truncate text-sm font-semibold text-ink">
                      {ticket.subject}
                    </span>
                    <span className="block text-[11px] text-ink-muted">{ticket.category}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate text-xs text-ink">{ticket.customerName ?? "�"}</span>
                    {ticket.orderRef ? (
                      <span className="block truncate font-mono text-[11px] text-primary">
                        {ticket.orderRef}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.priority === "URGENT"
                          ? "error"
                          : ticket.priority === "HIGH"
                            ? "warning"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">
                      {formatRelative(ticket.updatedAt)}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      {formatDateTime(ticket.updatedAt)}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {!ticket.assignedAdminId ? (
                        <Button
                          type="button"
                          size="sm"
                          loading={update.isPending}
                          onClick={() =>
                            update.mutate({
                              id: ticket.id,
                              payload: { assignedAdminId: adminId, status: "IN_PROGRESS" },
                            })
                          }
                        >
                          Take
                        </Button>
                      ) : (
                        <span className="text-[11px] text-ink-muted">
                          {ticket.assignedAdminName ?? "Assigned"}
                        </span>
                      )}
                      {ticket.status === "RESOLVED" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          loading={update.isPending}
                          onClick={() => update.mutate({ id: ticket.id, payload: { status: "OPEN" } })}
                        >
                          Reopen
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          loading={update.isPending}
                          onClick={() =>
                            update.mutate({ id: ticket.id, payload: { status: "RESOLVED" } })
                          }
                        >
                          Resolve
                        </Button>
                      )}
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
          label="tickets"
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
