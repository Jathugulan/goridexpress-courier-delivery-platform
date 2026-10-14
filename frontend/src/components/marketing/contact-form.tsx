"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Mail, MessageCircle, Phone, Send, Ticket, User } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, FieldError, FieldLabel, FieldDescription } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormErrorBanner } from "@/components/ui/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContactForm } from "@/hooks/queries";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/config";

const contactFormSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us your name").max(80, "That name is too long"),
  email: z.string().trim().min(1, "An email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(20, "That phone number is too long")
    .optional()
    .or(z.literal("")),
  topic: z
    .enum(["GENERAL", "BOOKING", "BUSINESS", "REPORT_ISSUE", "OTHER"], { message: "Choose a topic" }),
  orderRef: z
    .string()
    .trim()
    .max(32, "That order ID looks too long")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(3, "Add a short subject").max(120, "Keep the subject short"),
  message: z
    .string()
    .trim()
    .min(20, "Please give us at least 20 characters of detail")
    .max(2000, "Keep the message under 2000 characters"),
});

type ContactFormInput = z.infer<typeof contactFormSchema>;

const TOPICS = [
  { value: "GENERAL", label: "General enquiry" },
  { value: "BOOKING", label: "Help with a booking" },
  { value: "BUSINESS", label: "Business & bulk delivery" },
  { value: "REPORT_ISSUE", label: "Report a problem" },
  { value: "OTHER", label: "Something else" },
] as const;

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    note: "Replies within a few hours",
  },
  {
    icon: MessageCircle,
    label: "Live chat",
    value: "In-app chat",
    href: null,
    note: "Available after signing in",
  },
  {
    icon: Phone,
    label: "Phone",
    value: SUPPORT_PHONE,
    href: `tel:${SUPPORT_PHONE}`,
    note: "24/7 for active deliveries",
  },
] as const;

export function ContactForm({ className }: { className?: string }) {
  const { mutate, isPending, error, isSuccess, reset } = useContactForm();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      topic: "GENERAL",
      orderRef: "",
      subject: "",
      message: "",
    },
  });

  const topic = watch("topic");
  const message = watch("message") ?? "";
  const showOrderRef = topic === "REPORT_ISSUE" || topic === "BOOKING";

  if (isSuccess) {
    return (
      <Card padding="lg" className={cn("text-center", className)}>
        <span
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-success-light text-success-dark dark:text-success-light"
          aria-hidden="true"
        >
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="text-lg font-semibold text-ink">Message sent</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Thanks for getting in touch. A member of the support team will reply to your email address.
          If it is urgent, call us and quote your order ID.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => reset()}>
          Send another message
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" elevation="elevated" className={className}>
      <div className="mb-5 flex items-start gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light"
          aria-hidden="true"
        >
          <Send className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Send us a message</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Fields marked with an asterisk are required.
          </p>
        </div>
      </div>

      {error ? (
        <FormErrorBanner
          message={
            error instanceof Error ? error.message : "Could not send your message. Please try again."
          }
        />
      ) : null}

      <form
        onSubmit={handleSubmit((values) =>
          mutate({
            fullName: values.fullName,
            email: values.email,
            phone: values.phone || undefined,
            subject: values.subject,
            message: values.message,
            topic: values.topic,
            orderRef: values.orderRef || undefined,
          }),
        )}
        noValidate
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field required>
            <FieldLabel htmlFor="contact-name" required>
              Full name
            </FieldLabel>
            <Input
              id="contact-name"
              placeholder="Jane Doe"
              autoComplete="name"
              icon={<User />}
              invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
            <FieldError>{errors.fullName?.message}</FieldError>
          </Field>

          <Field required>
            <FieldLabel htmlFor="contact-email" required>
              Email address
            </FieldLabel>
            <Input
              id="contact-email"
              type="email"
              placeholder="jane@company.com"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="contact-phone">Phone (optional)</FieldLabel>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="+94 77 000 0000"
              autoComplete="tel"
              invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>

          <Field required>
            <FieldLabel htmlFor="contact-topic" required>
              Topic
            </FieldLabel>
            <Select
              value={topic}
              onValueChange={(value) =>
                setValue("topic", value as ContactFormInput["topic"], { shouldValidate: true })
              }
            >
              <SelectTrigger id="contact-topic" aria-invalid={Boolean(errors.topic)}>
                <SelectValue placeholder="Choose a topic" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.topic?.message}</FieldError>
          </Field>
        </div>

        {showOrderRef ? (
          <Field>
            <FieldLabel htmlFor="contact-order">Order ID (if you have one)</FieldLabel>
            <Input
              id="contact-order"
              placeholder="GRX123456"
              autoCapitalize="characters"
              spellCheck={false}
              invalid={Boolean(errors.orderRef)}
              {...register("orderRef")}
            />
            <FieldDescription>Helps us find your delivery faster.</FieldDescription>
            <FieldError>{errors.orderRef?.message}</FieldError>
          </Field>
        ) : null}

        <Field required>
          <FieldLabel htmlFor="contact-subject" required>
            Subject
          </FieldLabel>
          <Input
            id="contact-subject"
            placeholder="Short summary of what you need"
            invalid={Boolean(errors.subject)}
            {...register("subject")}
          />
          <FieldError>{errors.subject?.message}</FieldError>
        </Field>

        <Field required>
          <FieldLabel htmlFor="contact-message" required>
            Message
          </FieldLabel>
          <Textarea
            id="contact-message"
            rows={6}
            placeholder="Tell us what happened, including dates, locations and anything you have already tried."
            maxLength={2000}
            invalid={Boolean(errors.message)}
            {...register("message")}
          />
          <div className="flex items-center justify-between gap-3">
            <FieldError>{errors.message?.message}</FieldError>
            <span className="shrink-0 text-xs tabular-nums text-ink-muted">{message.length}/2000</span>
          </div>
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Badge variant="neutral" size="sm">
            Typical reply: under 4 hours
          </Badge>
          <Button type="submit" loading={isPending} className="w-full sm:w-auto">
            Send message
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function SupportChannels({ className }: { className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {SUPPORT_CHANNELS.map(({ icon: Icon, label, value, note, href }) => (
        <li key={label}>
          <Card padding="md" interactive="hover">
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink-secondary"
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="block truncate text-sm font-medium text-ink transition-colors hover:text-primary"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="truncate text-sm font-medium text-ink">{value}</p>
                )}
                <p className="truncate text-xs text-ink-muted">{note}</p>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function SupportHoursNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-ink-muted", className)}>
      <Ticket className="mr-1 inline size-3.5 align-text-bottom" aria-hidden="true" />
      Support hours: 24/7 for active deliveries, 08:00 – 20:00 for everything else.
    </p>
  );
}
