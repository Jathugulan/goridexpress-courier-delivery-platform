"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

type Side = "left" | "right" | "bottom" | "top";

const SIDE_CLASSES: Record<Side, string> = {
  left: cn(
    "inset-y-0 left-0 h-full w-[86vw] max-w-[20rem] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
    "rounded-r-3xl",
  ),
  right: cn(
    "inset-y-0 right-0 h-full w-[88vw] max-w-[26rem] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
    "rounded-l-3xl",
  ),
  bottom: cn(
    "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-3xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  ),
  top: cn(
    "inset-x-0 top-0 max-h-[88dvh] w-full rounded-b-3xl border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  ),
};

export interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  side?: Side;
  showClose?: boolean;
  closeLabel?: string;
  /** Hide the drag handle for edge-anchored sheets. */
  handle?: boolean;
}

export function SheetContent({
  className,
  children,
  side = "right",
  showClose = true,
  closeLabel = "Close panel",
  handle,
  ...props
}: SheetContentProps) {
  const isMobile = useIsMobile();
  const resolvedSide: Side = isMobile && side === "right" ? "bottom" : side;

  return (
    <SheetPortal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-[60] bg-[#0b1a2f]/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-[60] flex flex-col overflow-hidden border-line bg-card shadow-overlay",
          "transition ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300",
          SIDE_CLASSES[resolvedSide],
          className,
        )}
        {...props}
      >
        {handle ?? resolvedSide === "bottom" ? (
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
        ) : null}
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-3.5 top-3.5 z-10 flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={closeLabel}
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0 border-b border-line px-5 py-4 pr-14", className)} {...props} />;
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 gap-2 border-t border-line px-5 py-4 pb-safe sm:flex sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold text-ink", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("mt-1 text-sm text-ink-muted", className)} {...props} />
  );
}
