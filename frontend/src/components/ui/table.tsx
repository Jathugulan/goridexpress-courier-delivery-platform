import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                 Table shell                                */
/* -------------------------------------------------------------------------- */

export function TableContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-card shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function TableScroller({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto overscroll-x-contain scrollbar-none",
        "[&::-webkit-scrollbar]:h-2",
        className,
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full min-w-[44rem] border-collapse text-sm", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-line bg-muted/60", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-t border-line bg-muted/60", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-muted/50 data-[state=selected]:bg-primary-light/40",
        className,
      )}
      {...props}
    />
  );
}

export function TableHeadCell({
  className,
  sortable,
  sorted,
  align = "left",
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      scope="col"
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted first:pl-5 last:pr-5",
        align === "center" && "text-center",
        align === "right" && "text-right",
        sortable && "cursor-pointer select-none hover:text-ink",
        className,
      )}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
        {children}
        {sortable ? (
          <span aria-hidden="true" className="text-[10px] leading-none opacity-70">
            {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
          </span>
        ) : null}
      </span>
    </th>
  );
}

export function TableCell({
  className,
  align = "left",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "center" | "right" }) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-sm text-ink-secondary first:pl-5 last:pr-5",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn("mt-3 text-xs text-ink-muted", className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/*                        Responsive: row → card on mobile                    */
/* -------------------------------------------------------------------------- */

export function ResponsiveTable({
  headers,
  children,
  className,
  cardClassName,
  renderCard,
  caption,
  ariaLabel,
}: {
  headers: { label: string; className?: string; align?: "left" | "center" | "right" }[];
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
  /** Provide to enable the mobile card view (defaults to children). */
  renderCard?: (rowIndex: number) => React.ReactNode;
  caption?: string;
  ariaLabel?: string;
}) {
  if (renderCard) {
    return (
      <>
        <TableScroller className="hidden lg:block">
          <Table aria-label={ariaLabel} className={className}>
            <TableHead>
              <TableRow>
                {headers.map((h) => (
                  <TableHeadCell key={h.label} align={h.align} className={h.className}>
                    {h.label}
                  </TableHeadCell>
                ))}
              </TableRow>
            </TableHead>
            {children}
          </Table>
        </TableScroller>
        <div className="grid gap-3 lg:hidden">
          {React.Children.map(children, (row, i) => (
            <div key={i} className={cn("rounded-2xl border border-line bg-card p-4 shadow-xs", cardClassName)}>
              {renderCard(i)}
            </div>
          ))}
        </div>
        {caption ? <p className="mt-3 text-xs text-ink-muted">{caption}</p> : null}
      </>
    );
  }
  return null;
}
