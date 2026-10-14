"use client";

import * as React from "react";
import {
  BadgeCheck,
  Bike,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  useAdminCouriers,
  useAdminCourierMutations,
  useAdminVehicles,
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
import { formatDate } from "@/lib/format";
import type { Courier } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";
import { RatingStars } from "@/components/shared/status";
import { CourierStatusBadge } from "@/components/shared/status";

type CourierFilter = "ALL" | "ONLINE" | "BUSY" | "OFFLINE" | "SUSPENDED";

const FILTERS: FilterOption<CourierFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "ONLINE", label: "Available" },
  { value: "BUSY", label: "Busy" },
  { value: "OFFLINE", label: "Offline" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function AdminCouriersPanel() {
  const [search, setSearch] = React.useState("");
  const [status, setFilter] = React.useState<CourierFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [vehicleFor, setVehicleFor] = React.useState<Courier | null>(null);
  const [suspendFor, setSuspendFor] = React.useState<Courier | null>(null);
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

  const { data, isPending, isError, error, refetch, isFetching } = useAdminCouriers(params);
  const { approve, suspend, activate, remove, setStatus: changeStatus } =
    useAdminCourierMutations();
  const mutating =
    approve.isPending ||
    suspend.isPending ||
    activate.isPending ||
    remove.isPending ||
    changeStatus.isPending;
  const couriers = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Couriers" value={couriers.length} icon={UserCheck} tone="primary" />
        <StatCard
          label="Available"
          value={couriers.filter((c) => c.status === "ONLINE").length}
          icon={Bike}
          tone="success"
        />
        <StatCard
          label="Busy"
          value={couriers.filter((c) => c.status === "BUSY").length}
          icon={BadgeCheck}
          tone="info"
        />
        <StatCard
          label="Suspended"
          value={couriers.filter((c) => c.status === "SUSPENDED").length}
          icon={ShieldOff}
          tone={couriers.some((c) => c.status === "SUSPENDED") ? "warning" : "success"}
        />
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, phone or email…"
              label="Search couriers"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              options={FILTERS}
              label="Courier status"
              allLabel="All"
              value={status}
              onChange={(next) => setFilter(next as CourierFilter)}
            />
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add courier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh couriers"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={couriers.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={6} cols={5} />}
        empty={
          <ListEmptyState
            icon={UserX}
            title="No couriers"
            description="Add a courier to start assigning deliveries."
            action={
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add courier
              </Button>
            }
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Couriers"
            headers={[
              { label: "Courier" },
              { label: "Status" },
              { label: "Rating" },
              { label: "Vehicle" },
              { label: "Joined" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {couriers.map((courier) => (
                <TableRow key={courier.id}>
                  <TableCell>
                    <span className="block truncate text-sm font-semibold text-ink">
                      {courier.firstName} {courier.lastName}
                    </span>
                    <span className="block truncate text-[11px] text-ink-muted">
                      {courier.phone}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CourierStatusBadge status={courier.status} />
                    {courier.isVerified ? (
                      <Badge variant="success" size="sm" className="ml-1">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm" className="ml-1">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <RatingStars value={courier.rating} count={courier.totalDeliveries} showValue size="sm" />
                  </TableCell>
                  <TableCell>
                    {courier.vehicle ? (
                      <span className="text-xs text-ink">
                        {courier.vehicle.model}
                        <span className="ml-1 text-ink-muted">({courier.vehicle.registrationNumber})</span>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVehicleFor(courier)}
                      >
                        Assign
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">{formatDate(courier.createdAt)}</span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <select
                        value={courier.status}
                        onChange={(event) =>
                          changeStatus.mutate({
                            id: courier.id,
                            status: event.target.value as Courier["status"],
                          })
                        }
                        disabled={mutating || courier.status === "SUSPENDED"}
                        aria-label={`Change status for ${courier.firstName} ${courier.lastName}`}
                        className="h-8 rounded-lg border border-line bg-card px-2 text-xs text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
                      >
                        <option value="ONLINE">Available</option>
                        <option value="BUSY">Busy</option>
                        <option value="OFFLINE">Offline</option>
                      </select>

                      {!courier.isVerified ? (
                        <Button
                          type="button"
                          size="sm"
                          loading={approve.isPending}
                          onClick={() => approve.mutate(courier.id)}
                        >
                          Approve
                        </Button>
                      ) : courier.status === "SUSPENDED" ? (
                        <Button
                          type="button"
                          size="sm"
                          loading={activate.isPending}
                          onClick={() => activate.mutate(courier.id)}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSuspendFor(courier)}
                        >
                          Suspend
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        loading={remove.isPending}
                        aria-label={`Remove ${courier.firstName} ${courier.lastName}`}
                        onClick={() => remove.mutate(courier.id)}
                      >
                        {!remove.isPending ? <Trash2 className="size-4" aria-hidden="true" /> : null}
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
          label="couriers"
          onPageChange={setPage}
        />
      ) : null}

      <CreateCourierDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <AssignVehicleDialog courier={vehicleFor} onClose={() => setVehicleFor(null)} />
      <SuspendDialog
        courier={suspendFor}
        pending={suspend.isPending}
        onClose={() => setSuspendFor(null)}
        onConfirm={(reason) =>
          suspend.mutate(
            { id: suspendFor?.id as string, reason },
            { onSuccess: () => setSuspendFor(null) },
          )
        }
      />
    </div>
  );
}

function CreateCourierDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useAdminCourierMutations();
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate(form, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a courier</DialogTitle>
          <DialogDescription>
            New couriers start unapproved until you approve them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="courier-first">First name</FieldLabel>
              <Input
                id="courier-first"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="courier-last">Last name</FieldLabel>
              <Input
                id="courier-last"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="courier-email">Email</FieldLabel>
            <Input
              id="courier-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="courier-phone">Phone</FieldLabel>
              <Input
                id="courier-phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="courier-password">Temporary password</FieldLabel>
              <Input
                id="courier-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create courier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignVehicleDialog({
  courier,
  onClose,
}: {
  courier: Courier | null;
  onClose: () => void;
}) {
  const { data } = useAdminVehicles({ page: 1, limit: 50 });
  const { assignVehicle } = useAdminCourierMutations();

  return (
    <Dialog open={Boolean(courier)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign a vehicle</DialogTitle>
          <DialogDescription>
            {courier
              ? `Choose a vehicle for ${courier.firstName} ${courier.lastName}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {!data?.items?.length ? <p className="text-sm text-ink-muted">No vehicles in the fleet.</p> : null}
          {data?.items?.map((vehicle) => (
            <li key={vehicle.id} className="flex items-center justify-between gap-2 rounded-xl border border-line p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {vehicle.model}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {vehicle.registrationNumber} · {vehicle.type}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                loading={assignVehicle.isPending}
                onClick={() =>
                  assignVehicle.mutate(
                    { id: courier?.id as string, vehicleId: vehicle.id },
                    { onSuccess: onClose },
                  )
                }
              >
                Assign
              </Button>
            </li>
          ))}
        </ul>
        {courier?.vehicle ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            loading={assignVehicle.isPending}
            onClick={() =>
              assignVehicle.mutate(
                { id: courier.id, vehicleId: null },
                { onSuccess: onClose },
              )
            }
          >
            Unassign current vehicle
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SuspendDialog({
  courier,
  pending,
  onClose,
  onConfirm,
}: {
  courier: Courier | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  return (
    <Dialog open={Boolean(courier)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend courier</DialogTitle>
          <DialogDescription>
            They are signed out of the courier app and removed from assignment pools.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="suspend-reason">Reason</FieldLabel>
          <Input
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Repeated late deliveries"
          />
        </Field>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={pending} onClick={() => onConfirm(reason.trim() || "Suspended by operations")}>
            Suspend
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

