"use client";

import * as React from "react";
import { Ban, Bike, Play, RefreshCw, Truck, Zap } from "lucide-react";
import { useLiveDeliveries, useAdminDeliveryMutations } from "@/hooks/admin-queries";
import { useDebouncedValue, FilterChips, type FilterOption } from "@/components/shared/filters";
import { formatDistance, formatEta, formatRelative } from "@/lib/format";
import { orderMeta, ORDER_FLOW } from "@/lib/status";
import type { OrderStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { StatCard } from "@/components/shared/cards";
import { OrderStatusBadge, EtaBadge } from "@/components/shared/status";
import { LiveConnectionChip } from "@/components/shared/tracking-map";
import { LiveOperationsMap } from "@/components/shared/tracking-map";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "ACTIVE" | "DELAYED" | "COMPLETED";

const FILTERS: FilterOption<StatusFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "In transit" },
  { value: "DELAYED", label: "Delayed" },
  { value: "COMPLETED", label: "Completed" },
];

const ACTIVE: OrderStatus[] = [
  "CREATED",
  "CONFIRMED",
  "COURIER_ASSIGNMENT",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

export function LiveOperationsBoard() {
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search);
  const { simulate, advanceStatus } = useAdminDeliveryMutations();

  const params = React.useMemo(
    () => ({ page: 1, limit: 50, ...(debounced.trim() ? { search: debounced.trim() } : {}) }),
    [debounced],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useLiveDeliveries(params);
  const live = data?.items ?? [];

  const filtered = React.useMemo(() => {
    if (status === "ALL") return live;
    if (status === "DELAYED") return live.filter((d) => d.isDelayed);
    if (status === "COMPLETED") return live.filter((d) => d.status === "DELIVERED");
    return live.filter((d) => ACTIVE.includes(d.status as OrderStatus));
  }, [live, status]);

  const delayed = live.filter((d) => d.isDelayed).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="On the board" value={live.length} icon={Truck} tone="primary" />
        <StatCard
          label="In transit"
          value={live.filter((d) => ACTIVE.includes(d.status as OrderStatus)).length}
          icon={Bike}
          tone="info"
        />
        <StatCard
          label="Delayed"
          value={delayed}
          icon={Zap}
          tone={delayed > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Unassigned"
          value={live.filter((d) => !d.courierId).length}
          icon={Ban}
          tone={live.some((d) => !d.courierId) ? "error" : "success"}
        />
      </div>

      <Card padding="none" className="overflow-hidden">
        {isError ? (
          <div className="p-4">
            <ErrorState
              description={error instanceof Error ? error.message : undefined}
              onRetry={() => void refetch()}
            />
          </div>
        ) : live.length > 0 ? (
          <LiveOperationsMap deliveries={live} height="lg" />
        ) : null}
      </Card>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <FilterChips
              options={FILTERS}
              label="Delivery status"
              allLabel="All"
              value={status}
              onChange={(next) => setStatus(next as StatusFilter)}
            />
            <LiveConnectionChip connected={!isError} lastUpdatedAt={data?.items?.[0]?.updatedAt} />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="live-search" className="sr-only">
              Search deliveries
            </label>
            <input
              id="live-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order or customer…"
              className="h-9 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:w-56"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh live board"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      {isPending ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={Truck}
            title="Nothing on the board"
            description={
              live.length > 0
                ? "No deliveries match this filter."
                : "Active deliveries appear here as soon as couriers accept jobs."
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((delivery) => (
            <LiveDeliveryCard
              key={delivery.deliveryId}
              delivery={delivery}
              onAdvance={(next) => advanceStatus.mutate({ id: delivery.deliveryId, status: next })}
              onSimulate={() => simulate.mutate(delivery.deliveryId)}
              advancing={advanceStatus.isPending}
              simulating={simulate.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveDeliveryCard({
  delivery,
  onAdvance,
  onSimulate,
  advancing,
  simulating,
}: {
  delivery: {
    deliveryId: string;
    orderId: string;
    status: OrderStatus;
    customerName: string;
    courierId: string;
    courierName: string;
    pickup: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    currentLocation: { latitude: number; longitude: number } | null;
    eta?: number | null;
    distanceKm?: number | null;
    isDelayed: boolean;
    updatedAt?: string;
  };
  onAdvance: (status: OrderStatus) => void;
  onSimulate: () => void;
  advancing: boolean;
  simulating: boolean;
}) {
  const meta = orderMeta(delivery.status);
  const flowIndex = ORDER_FLOW.indexOf(delivery.status);
  const nextStatus = flowIndex >= 0 && flowIndex < ORDER_FLOW.length - 1 ? ORDER_FLOW[flowIndex + 1] : null;

  return (
    <Card
      padding="md"
      className={cn("h-full", delivery.isDelayed && "border-warning/50 bg-warning-light/20 dark:bg-warning/5")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-bold text-ink">{delivery.orderId}</p>
          <p className="truncate text-[11px] text-ink-muted">{delivery.customerName}</p>
        </div>
        <OrderStatusBadge status={delivery.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-ink-muted">Courier</dt>
          <dd className="truncate font-medium text-ink">
            {delivery.courierName || "Unassigned"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">ETA</dt>
          <dd>
            <EtaBadge minutes={delivery.eta ?? null} isDelayed={delivery.isDelayed} />
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Distance</dt>
          <dd className="font-medium text-ink">{formatDistance(delivery.distanceKm)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Updated</dt>
          <dd className="font-medium text-ink">{formatRelative(delivery.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <Badge variant="neutral" size="sm">
          {meta.label}
        </Badge>
        <div className="ml-auto flex gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSimulate}
            loading={simulating}
            title="Stream simulated courier positions over Socket.IO"
          >
            {!simulating ? <Play className="size-3.5" aria-hidden="true" /> : null}
            Simulate
          </Button>
          {nextStatus ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={advancing}
              onClick={() => onAdvance(nextStatus)}
            >
              {orderMeta(nextStatus).label}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

