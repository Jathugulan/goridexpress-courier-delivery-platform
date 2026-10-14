"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LifeBuoy, MessageSquarePlus } from "lucide-react";
import {
  useSupportTickets,
  useSupportMutations,
  errorMessage,
} from "@/hooks/queries";
import { ticketSchema, type TicketInput } from "@/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Field, FieldError, FieldLabel } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormErrorBanner } from "@/components/ui/states";
import { DataState, ListEmptyState, FilterChips, type FilterOption } from "@/components/shared/filters";
import { SupportTicketCard } from "@/components/shared/cards";
import { PaginationBar } from "@/components/shared/pagination";

type Filter = "ALL" | "OPEN" | "PENDING" | "RESOLVED";

const FILTERS: FilterOption<Filter>[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "RESOLVED", label: "Resolved" },
];

const CATEGORIES = [
  { value: "DELIVERY_ISSUE", label: "Delivery issue" },
  { value: "PAYMENT", label: "Payment or refund" },
  { value: "ACCOUNT", label: "Account" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "OTHER", label: "Something else" },
];

export function SupportPanel() {
  const [filter, setFilter] = React.useState<Filter>("ALL");
  const [page, setPage] = React.useState(1);
  const { create } = useSupportMutations();

  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  const params = React.useMemo(
    () => ({ page, limit: 10, ...(filter !== "ALL" ? { status: filter } : {}) }),
    [filter, page],
  );

  const { data, isPending, isError, error, refetch } = useSupportTickets(params);
  const tickets = data?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: "", category: "DELIVERY_ISSUE", priority: "MEDIUM", description: "" },
  });

  const onSubmit = (values: TicketInput) => {
    create.mutate(
      {
        subject: values.subject,
        category: values.category,
        priority: values.priority,
        description: values.description,
      },
      { onSuccess: () => reset() },
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card padding="sm">
          <FilterChips
            options={FILTERS}
            label="Ticket status"
            allLabel="All"
            value={filter}
            onChange={(next) => setFilter(next as Filter)}
          />
        </Card>

        <DataState
          isLoading={isPending}
          error={isError ? error : null}
          isEmpty={tickets.length === 0}
          onRetry={() => void refetch()}
          skeleton={
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} padding="md">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </Card>
              ))}
            </div>
          }
          empty={
            <ListEmptyState
              icon={LifeBuoy}
              title="No support tickets"
              description="Open a ticket and our team will reply by email and in-app notification."
            />
          }
        >
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <SupportTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
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

      <Card padding="md" className="lg:sticky lg:top-24 lg:self-start">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-sm">
            <MessageSquarePlus className="size-4 text-primary" aria-hidden="true" />
            Open a ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {create.isError ? <FormErrorBanner message={errorMessage(create.error)} /> : null}

            <Field required>
              <FieldLabel htmlFor="ticket-subject" required>
                Subject
              </FieldLabel>
              <Input
                id="ticket-subject"
                placeholder="Short summary of the problem"
                invalid={Boolean(errors.subject)}
                {...register("subject")}
              />
              <FieldError>{errors.subject?.message}</FieldError>
            </Field>

            <Field required>
              <FieldLabel htmlFor="ticket-category" required>
                Category
              </FieldLabel>
              <Select defaultValue="DELIVERY_ISSUE" name="ticket-select">
                <SelectTrigger id="ticket-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.category?.message}</FieldError>
            </Field>

            <Field required>
              <FieldLabel htmlFor="ticket-priority" required>
                Priority
              </FieldLabel>
              <Select defaultValue="MEDIUM" name="ticket-select">
                <SelectTrigger id="ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field required>
              <FieldLabel htmlFor="ticket-description" required>
                What happened?
              </FieldLabel>
              <Textarea
                id="ticket-description"
                rows={5}
                maxLength={1000}
                placeholder="Include the order reference if it relates to a delivery."
                invalid={Boolean(errors.description)}
                {...register("description")}
              />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>

            <Button type="submit" className="w-full" loading={create.isPending}>
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
