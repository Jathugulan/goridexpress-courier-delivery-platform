"use client";

import * as React from "react";
import { Percent, Plus, Power, RefreshCw, Ticket, Trash2 } from "lucide-react";
import { useAdminCoupons, useAdminCouponMutations } from "@/hooks/admin-queries";
import { useAdminPromotions, useAdminPromotionMutations } from "@/hooks/admin-queries";
import { SearchInput, DataState, ListEmptyState, TableLoadingSkeleton } from "@/components/shared/filters";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/input";
import { Field, FieldLabel, Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveTable, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/shared/pagination";
import { StatCard } from "@/components/shared/cards";

/* --------------------------------- Coupons -------------------------------- */

export function AdminCouponsPanel() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const params = React.useMemo(
    () => ({ page, limit: 12, ...(search.trim() ? { search: search.trim() } : {}) }),
    [page, search],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useAdminCoupons(params);
  const { create, update, remove } = useAdminCouponMutations();
  const coupons = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Coupons" value={coupons.length} icon={Ticket} tone="primary" />
        <StatCard
          label="Active"
          value={coupons.filter((c) => c.isActive).length}
          icon={Power}
          tone="success"
        />
        <StatCard
          label="Redemptions"
          value={coupons.reduce((sum, c) => sum + (c.usedCount ?? 0), 0)}
          icon={Percent}
        />
      </div>

      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search coupon code…"
              label="Search coupons"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" aria-hidden="true" />
              New coupon
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh coupons"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={coupons.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={5} cols={5} />}
        empty={
          <ListEmptyState
            icon={Ticket}
            title="No coupons"
            description="Create a coupon to run a marketing campaign."
            action={
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                New coupon
              </Button>
            }
          />
        }
      >
        <Card padding="none" className="overflow-hidden">
          <ResponsiveTable
            ariaLabel="Coupons"
            headers={[
              { label: "Code" },
              { label: "Discount" },
              { label: "Usage" },
              { label: "Window" },
              { label: "Active" },
              { label: "Actions", align: "right" },
            ]}
          >
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <span className="block font-mono text-xs font-bold text-primary">
                      {coupon.code}
                    </span>
                    {coupon.description ? (
                      <span className="block truncate text-[11px] text-ink-muted">
                        {coupon.description}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-ink">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : formatCurrency(coupon.discountValue)}
                    </span>
                    {coupon.maximumDiscount ? (
                      <span className="block text-[11px] text-ink-muted">
                        max {formatCurrency(coupon.maximumDiscount)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-ink">
                      {coupon.usedCount ?? 0}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-[11px] text-ink-muted">
                      {coupon.startDate ? formatDate(coupon.startDate) : "—"}
                      {" → "}
                      {coupon.endDate ? formatDate(coupon.endDate) : "no expiry"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={coupon.isActive}
                      aria-label={`Toggle coupon ${coupon.code}`}
                      onCheckedChange={(checked) =>
                        update.mutate({ id: coupon.id, payload: { isActive: checked } })
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      loading={remove.isPending}
                      aria-label={`Delete coupon ${coupon.code}`}
                      onClick={() => remove.mutate(coupon.id)}
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
          label="coupons"
          onPageChange={setPage}
        />
      ) : null}

      <CreateCouponDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateCouponDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useAdminCouponMutations();
  const [form, setForm] = React.useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "10",
    maxDiscountAmount: "",
    minimumOrderAmount: "",
    usageLimit: "",
    startsAt: "",
    expiresAt: "",
  });

  const isPercentage = form.discountType === "PERCENTAGE";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a coupon</DialogTitle>
          <DialogDescription>Codes are matched case-insensitively at checkout.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              {
                code: form.code.trim().toUpperCase(),
                description: form.description.trim() || undefined,
                discountType: form.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
                discountValue: Number(form.discountValue),
                maximumDiscount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
                minimumOrder: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : 0,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
                isActive: true,
                startDate: new Date(form.startsAt || Date.now()).toISOString(),
                endDate: new Date(
                  form.expiresAt || Date.now() + 90 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              },
              { onSuccess: onClose },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="cp-code">Code</FieldLabel>
              <Input
                id="cp-code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="GRX20"
                className="uppercase"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cp-type">Discount type</FieldLabel>
              <select
                id="cp-type"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed amount</option>
              </select>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="cp-desc">Description</FieldLabel>
            <Input
              id="cp-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Festival 20% off"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="cp-value">Value ({isPercentage ? "%" : "amount"})</FieldLabel>
              <Input
                id="cp-value"
                type="number"
                required
                min={0}
                max={isPercentage ? 100 : undefined}
                step="0.01"
                inputMode="decimal"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cp-max">Max discount</FieldLabel>
              <Input
                id="cp-max"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                placeholder="Optional"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cp-min">Min order</FieldLabel>
              <Input
                id="cp-min"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.minimumOrderAmount}
                onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })}
                placeholder="Optional"
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="cp-usage">Usage limit</FieldLabel>
              <Input
                id="cp-usage"
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="Unlimited"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cp-start">Starts</FieldLabel>
              <Input
                id="cp-start"
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cp-end">Expires</FieldLabel>
              <Input
                id="cp-end"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create coupon
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Promotions ------------------------------- */

export function AdminPromotionsPanel() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const params = React.useMemo(
    () => ({ page, limit: 12, ...(search.trim() ? { search: search.trim() } : {}) }),
    [page, search],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useAdminPromotions(params);
  const { update } = useAdminPromotionMutations();
  const promotions = data?.items ?? [];

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search banner title…"
              label="Search promotions"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" aria-hidden="true" />
              New promotion
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh promotions"
            >
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </div>
      </Card>

      <DataState
        isLoading={isPending}
        error={isError ? error : null}
        isEmpty={promotions.length === 0}
        onRetry={() => void refetch()}
        skeleton={<TableLoadingSkeleton rows={4} cols={4} />}
        empty={
          <ListEmptyState
            icon={Percent}
            title="No promotions"
            description="Promotional banners appear on the public home page."
            action={
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                New promotion
              </Button>
            }
          />
        }
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {promotions.map((promo) => (
            <li key={promo.id}>
              <Card padding="md" className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle as="h3" className="text-sm">
                      {promo.title}
                    </CardTitle>
                    <Switch
                      checked={promo.isActive}
                      aria-label={`Toggle promotion ${promo.title}`}
                      onCheckedChange={(checked) =>
                        update.mutate({ id: promo.id, payload: { isActive: checked } })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink-muted">{promo.subtitle ?? ""}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant={promo.isActive ? "success" : "neutral"} size="sm">
                      {promo.isActive ? "Live" : "Paused"}
                    </Badge>
                    {promo.badgeText ? (
                      <Badge variant="primary" size="sm">
                        {promo.badgeText}
                      </Badge>
                    ) : null}
                    {promo.ctaHref ? (
                      <Badge variant="info" size="sm">
                        Links to {promo.ctaHref}
                      </Badge>
                    ) : null}
                  </div>
                  {promo.startsAt || promo.endsAt ? (
                    <p className="mt-2 text-[11px] text-ink-muted">
                      {promo.startsAt ? formatDate(promo.startsAt) : "now"} →{" "}
                      {promo.endsAt ? formatDate(promo.endsAt) : "no end date"}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </DataState>

      {data ? (
        <PaginationBar
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          label="promotions"
          onPageChange={setPage}
        />
      ) : null}

      <CreatePromotionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreatePromotionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useAdminPromotionMutations();
  const [form, setForm] = React.useState({
    title: "",
    subtitle: "",
    badge: "",
    linkUrl: "",
    imageUrl: "",
    startsAt: "",
    endsAt: "",
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a promotion</DialogTitle>
          <DialogDescription>Banners rotate on the public home page carousel.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              {
                title: form.title.trim(),
                subtitle: form.subtitle.trim(),
                badgeText: form.badge.trim() || undefined,
                ctaHref: form.linkUrl.trim() || undefined,
                bannerImage: form.imageUrl.trim() || null,
                isActive: true,
                startsAt: new Date(form.startsAt || Date.now()).toISOString(),
                endsAt: new Date(
                  form.endsAt || Date.now() + 90 * 24 * 60 * 60 * 1000,
                ).toISOString(),
              },
              { onSuccess: onClose },
            );
          }}
        >
          <Field>
            <FieldLabel htmlFor="pr-title">Title</FieldLabel>
            <Input
              id="pr-title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="pr-sub">Subtitle</FieldLabel>
            <Input
              id="pr-sub"
              required
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pr-badge">Badge</FieldLabel>
              <Input
                id="pr-badge"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="e.g. LIMITED"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pr-link">Link URL</FieldLabel>
              <Input
                id="pr-link"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="/pricing"
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pr-start">Starts</FieldLabel>
              <Input
                id="pr-start"
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pr-end">Ends</FieldLabel>
              <Input
                id="pr-end"
                type="date"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create promotion
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
