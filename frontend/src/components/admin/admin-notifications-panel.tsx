"use client";

import * as React from "react";
import { BellRing, CheckCheck, RefreshCw, Send } from "lucide-react";
import { useAdminNotifications, useAdminNotificationMutations } from "@/hooks/admin-queries";
import {
  useDebouncedValue,
  SearchInput,
  FilterChips,
  DataState,
  ListEmptyState,
  TableLoadingSkeleton,
  type FilterOption,
} from "@/components/shared/filters";
import { formatRelative } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";
import { Badge } from "@/components/ui/badge";

type ChannelFilter = "ALL" | "PUSH" | "EMAIL" | "SMS";

const FILTERS: FilterOption<ChannelFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "PUSH", label: "Push" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
];

export function AdminNotificationsPanel() {
  const [search, setSearch] = React.useState("");
  const [channel, setChannel] = React.useState<ChannelFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const debounced = useDebouncedValue(search);

  React.useEffect(() => {
    setPage(1);
  }, [debounced, channel]);

  const params = React.useMemo(
    () => ({
      page,
      limit: 12,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(channel !== "ALL" ? { channel } : {}),
    }),
    [debounced, channel, page],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useAdminNotifications(params);
  const { markRead, markAllRead } = useAdminNotificationMutations();
  const notifications = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Notifications" value={notifications.length} icon={BellRing} tone="primary" />
        <StatCard
          label="Unread"
          value={notifications.filter((n) => !n.isRead).length}
          icon={Send}
          tone={notifications.some((n) => !n.isRead) ? "warning" : "success"}
        />
        <StatCard
          label="Read"
          value={notifications.filter((n) => n.isRead).length}
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
              placeholder="Search title or message…"
              label="Search notifications"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              options={FILTERS}
              label="Channel"
              allLabel="All"
              value={channel}
              onChange={(next) => setChannel(next as ChannelFilter)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh notifications"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={notifications.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={6} cols={4} />}
        empty={
          <ListEmptyState
            icon={BellRing}
            title="No notifications"
            description="System notifications appear here as they are generated."
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Notifications"
            headers={[
              { label: "Notification" },
              { label: "Type" },
              { label: "Audience" },
              { label: "Sent" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <span className="block max-w-[20rem] truncate text-sm font-semibold text-ink">
                      {notification.title}
                    </span>
                    <span className="block max-w-[20rem] truncate text-[11px] text-ink-muted">
                      {notification.message}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {notification.type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">
                      {notification.userId ? "Individual" : "All users"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">
                      {formatRelative(notification.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    {notification.isRead ? (
                      <span className="text-xs text-ink-muted">Read</span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={markRead.isPending}
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        Mark read
                      </Button>
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
          label="notifications"
          onPageChange={setPage}
        />
      ) : null}

    </div>
  );
}

