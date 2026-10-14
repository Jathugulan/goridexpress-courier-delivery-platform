"use client";

import * as React from "react";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "./badge";

/* -------------------------------------------------------------------------- */
/*                                 Command                                   */
/* -------------------------------------------------------------------------- */

export const CommandDialog = DialogPrimitive.Root;

export function CommandDialogContent({
  className,
  children,
  title = "Search GoRideXpress",
  description = "Search orders, customers, pages and settings.",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title?: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[85] bg-[#0b1a2f]/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-[8vh] z-[86] w-[min(94vw,40rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-card shadow-overlay",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
        <Command
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-muted"
          shouldFilter
        >
          {children}
        </Command>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function CommandInput({
  className,
  placeholder = "Search…",
  ...props
}: React.ComponentProps<typeof Command.Input>) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line px-4" cmdk-input-wrapper="">
      <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <Command.Input
        className={cn(
          "h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-disabled",
          className,
        )}
        placeholder={placeholder}
        {...props}
      />
      <Kbd className="hidden shrink-0 sm:inline-flex">ESC</Kbd>
    </div>
  );
}

export function CommandList({ className, ...props }: React.ComponentProps<typeof Command.List>) {
  return (
    <Command.List
      className={cn("max-h-[22rem] overflow-y-auto overscroll-contain p-2", className)}
      {...props}
    />
  );
}

export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof Command.Empty>) {
  return (
    <Command.Empty
      className={cn("px-3 py-8 text-center text-sm text-ink-muted", className)}
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  heading,
  children,
  ...props
}: React.ComponentProps<typeof Command.Group> & { heading?: string }) {
  return (
    <Command.Group
      heading={heading}
      className={cn("overflow-hidden text-ink [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-muted", className)}
      {...props}
    >
      {children}
    </Command.Group>
  );
}

export function CommandItem({ className, ...props }: React.ComponentProps<typeof Command.Item>) {
  return (
    <Command.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-secondary outline-none",
        "data-[selected=true]:bg-primary-light data-[selected=true]:text-primary-dark dark:data-[selected=true]:text-primary-light",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({ className, ...props }: React.ComponentProps<typeof Command.Separator>) {
  return <Command.Separator className={cn("my-1 h-px bg-line", className)} {...props} />;
}

export function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("ml-auto text-xs tracking-widest text-ink-disabled", className)} {...props} />;
}
