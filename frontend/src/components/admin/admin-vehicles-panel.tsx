"use client";

import * as React from "react";
import { Building2, Plus, RefreshCw, Trash2, UserX, Wrench } from "lucide-react";
import { useAdminVehicles, useAdminVehicleMutations } from "@/hooks/admin-queries";
import {
  SearchInput,
  FilterChips,
  DataState,
  ListEmptyState,
  TableLoadingSkeleton,
  useDebouncedValue,
  type FilterOption,
} from "@/components/shared/filters";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";
import type { Vehicle, VehicleType } from "@/types";

type VehicleFilter = "ALL" | "ACTIVE" | "MAINTENANCE" | "INACTIVE";

const FILTERS: FilterOption<VehicleFilter>[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
];

const STATUS_TONE: Record<Vehicle["status"], "success" | "warning" | "neutral"> = {
  ACTIVE: "success",
  MAINTENANCE: "warning",
  INACTIVE: "neutral",
};

export function AdminVehiclesPanel() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<VehicleFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);
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

  const { data, isPending, isError, error, refetch, isFetching } = useAdminVehicles(params);
  const { remove, update } = useAdminVehicleMutations();
  const vehicles = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Fleet size" value={vehicles.length} icon={Building2} tone="primary" />
        <StatCard
          label="In maintenance"
          value={vehicles.filter((v) => v.status === "MAINTENANCE").length}
          icon={Wrench}
          tone={vehicles.some((v) => v.status === "MAINTENANCE") ? "warning" : "success"}
        />
        <StatCard
          label="Unassigned"
          value={vehicles.filter((v) => !v.courierId).length}
          icon={UserX}
        />
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search model or registration…"
              label="Search vehicles"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterChips
              options={FILTERS}
              label="Vehicle status"
              allLabel="All"
              value={status}
              onChange={(next) => setStatus(next as VehicleFilter)}
            />
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add vehicle
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh vehicles"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={vehicles.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={6} cols={5} />}
        empty={
          <ListEmptyState
            icon={Building2}
            title="No vehicles"
            description="Add vehicles so couriers can be assigned to them."
            action={
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add vehicle
              </Button>
            }
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Vehicles"
            headers={[
              { label: "Vehicle" },
              { label: "Registration" },
              { label: "Type" },
              { label: "Status" },
              { label: "Added" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <span className="block truncate text-sm font-semibold text-ink">
                      {vehicle.model}
                    </span>
                    {vehicle.color ? (
                      <span className="block text-[11px] text-ink-muted">{vehicle.color}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-ink">
                      {vehicle.registrationNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {vehicle.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      value={vehicle.status}
                      aria-label={`Status for ${vehicle.registrationNumber}`}
                      disabled={update.isPending}
                      onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                        update.mutate({
                          id: vehicle.id,
                          payload: { status: event.target.value as Vehicle["status"] },
                        })
                      }
                      className="h-8 w-32 rounded-lg border border-line bg-card px-2 text-xs text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-ink-muted">{formatDate(vehicle.createdAt)}</span>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      loading={remove.isPending}
                      aria-label={`Remove ${vehicle.registrationNumber}`}
                      onClick={() => remove.mutate(vehicle.id)}
                    >
                      {!remove.isPending ? <Trash2 className="size-4" aria-hidden="true" /> : null}
                    </Button>
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
          label="vehicles"
          onPageChange={setPage}
        />
      ) : null}

      <CreateVehicleDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateVehicleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useAdminVehicleMutations();
  const [form, setForm] = React.useState({
    model: "",
    registrationNumber: "",
    type: "MOTORCYCLE" as VehicleType,
    color: "",
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a vehicle</DialogTitle>
          <DialogDescription>Register a fleet vehicle for courier assignment.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(form, { onSuccess: onClose });
          }}
        >
          <Field>
            <FieldLabel htmlFor="veh-model">Model</FieldLabel>
            <Input
              id="veh-model"
              required
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="e.g. Honda Activa 6G"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="veh-reg">Registration number</FieldLabel>
              <Input
                id="veh-reg"
                required
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="veh-type">Type</FieldLabel>
              <select
                id="veh-type"
                value={form.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, type: e.target.value as VehicleType })
                }
                className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="CAR">Car</option>
                <option value="VAN">Van</option>
                <option value="BICYCLE">Bicycle</option>
                <option value="PEDICAB">Pedicab</option>
              </select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="veh-color">Colour (optional)</FieldLabel>
            <Input
              id="veh-color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Add vehicle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
