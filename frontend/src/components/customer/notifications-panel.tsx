"use client";

import * as React from "react";
import { Bell, BellOff, CheckCheck, RefreshCw } from "lucide-react";
import { useNotifications, useNotificationMutations } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterChips, ListEmptyState, DataState, type FilterOption } from "@/components/shared/filters";
import { NotificationItem } from "@/components/shared/cards";
import { PaginationBar } from "@/components/shared/pagination";


type Filter = "ALL" | "UNREAD" | "DELIVERY" | "PAYMENT" | "PROMOTION";

const FILTERS: FilterOption<Filter>[] = [
  { value: "ALL", label: "All" },
  { value: "UNREAD", label: "Unread" },
  { value: "DELIVERY", label: "Deliveries" },
  { value: "PAYMENT", label: "Payments" },
  { value: "PROMOTION", label: "Promotions" },
];

export function NotificationsPanel() {
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [page, setPage] = React.useState(1);
  const { markRead, markAllRead, remove } = useNotificationMutations();

  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  const params = React.useMemo(() => {
    const base: Record<string, string | number | boolean> = { page, limit: 15 };
    if (filter === "UNREAD") base.unreadOnly = true;
    if (filter === "DELIVERY") base.type = "DELIVERY";
    if (filter === "PAYMENT") base.type = "PAYMENT";
    if (filter === "PROMOTION") base.type = "PROMOTION";
    return base;
  }, [filter, page]);

  const { data, isPending, isError, error, refetch, isFetching } = useNotifications(params);
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips
            options={FILTERS}
            label="Notification type"
            allLabel="All"
            value={filter}
            onChange={(next) => setFilter(next as Filter)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
              disabled={items.length === 0}
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
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
        isEmpty={items.length === 0}
        onRetry={() => void refetch()}
        skeleton={
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
              </Card>
            ))}
          </div>
        }
        empty={
          <ListEmptyState
            icon={BellOff}
            title="Nothing here"
            description={
              filter === "ALL"
                ? "Delivery updates, payment receipts and offers will appear here."
                : "No notifications match this filter."
            }
            action={
              filter !== "ALL" ? (
                <Button type="button" variant="outline" onClick={() => setFilter("ALL")}>
                  Show all
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="space-y-2">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={(id) => markRead.mutate(id)}
              onRemove={(id) => remove.mutate(id)}
            />
          ))}
        </div>
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

