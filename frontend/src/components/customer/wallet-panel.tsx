"use client";

import * as React from "react";
import { History, Plus, Wallet } from "lucide-react";
import { useWallet, useWalletTransactions, useAddDemoMoney } from "@/hooks/queries";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/states";
import { ListEmptyState } from "@/components/shared/filters";
import { WalletCard, WalletTransactionRow } from "@/components/shared/cards";
import { PaginationBar } from "@/components/shared/pagination";
import { DemoTag } from "@/components/shared/status";


const TOP_UP_PRESETS = [10, 25, 50, 100];

export function WalletPanel() {
  const { data: wallet, isPending, isError, error, refetch } = useWallet();
  const [page, setPage] = React.useState(1);
  const addDemoMoney = useAddDemoMoney();
  const [topUpOpen, setTopUpOpen] = React.useState(false);

  const { data: transactions, isPending: txPending } = useWalletTransactions({ page, limit: 10 });
  const tx = transactions?.items ?? [];

  React.useEffect(() => {
    setPage(1);
  }, []);

  return (
    <div className="space-y-5">
      {isPending ? (
        <Card padding="lg">
          <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
        </Card>
      ) : isError || !wallet ? (
        <Card padding="lg">
          <ErrorState
            description={isError ? undefined : "No wallet found for this account."}
            onRetry={() => void refetch()}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="space-y-3">
            <WalletCard wallet={wallet} />
            <Card padding="md">
              <CardHeader>
                <CardTitle as="h2" className="text-sm">
                  Add demo money
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-ink-muted">
                  Top up your simulated balance to test wallet payments. No real funds are involved.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOP_UP_PRESETS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={addDemoMoney.isPending && addDemoMoney.variables === amount}
                      onClick={() => addDemoMoney.mutate(amount)}
                    >
                      +{formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setTopUpOpen(true)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Custom amount
                </Button>
                <DemoTag className="inline-flex" />
              </CardContent>
            </Card>
          </div>

          <Card padding="md">
            <CardHeader>
              <CardTitle as="h2" className="flex items-center gap-2 text-sm">
                <History className="size-4 text-primary" aria-hidden="true" />
                Transaction history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txPending ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : tx.length === 0 ? (
                <ListEmptyState
                  compact
                  icon={Wallet}
                  title="No transactions"
                  description="Wallet credits, debits and refunds appear here."
                />
              ) : (
                <div className="space-y-2">
                  {tx.map((transaction) => (
                    <WalletTransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              )}

              {transactions ? (
                <div className="mt-4">
                  <PaginationBar
                    page={transactions.pagination.page}
                    totalPages={transactions.pagination.totalPages}
                    total={transactions.pagination.total}
                    label="transactions"
                    onPageChange={setPage}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onSubmit={(amount) =>
          addDemoMoney.mutate(amount, { onSuccess: () => setTopUpOpen(false) })
        }
        pending={addDemoMoney.isPending}
      />
    </div>
  );
}

function TopUpDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => void;
  pending: boolean;
}) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (amount > 1000) {
      setError("Demo top-ups are capped at $1,000.");
      return;
    }
    setError(null);
    onSubmit(amount);
    setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add demo money</DialogTitle>
          <DialogDescription>
            This credits a simulated balance only. No payment gateway is contacted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field required>
            <FieldLabel htmlFor="topup-amount" required>
              Amount
            </FieldLabel>
            <Input
              id="topup-amount"
              inputMode="decimal"
              placeholder="25.00"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              invalid={Boolean(error)}
            />
            <FieldError>{error}</FieldError>
            <FieldDescription>Between $0.01 and $1,000.</FieldDescription>
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Add demo money
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

