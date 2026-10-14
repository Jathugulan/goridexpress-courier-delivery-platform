"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ExternalLink, LifeBuoy, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useLogout, useUnreadCount } from "@/hooks/queries";
import { Logo } from "./logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/display";
import { navFor, type NavItem } from "@/constants/navigation";
import { DEMO_NOTICE_SHORT } from "@/constants/design";
import { APP_NAME } from "@/config";

/** Matches `/customer/orders/123` to the `/customer/orders` item, but not `/customer/ordersX`. */
function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const sections = React.useMemo(() => navFor(role), [role]);
  const { mutate: logout } = useLogout();

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
        <Logo
          href={role === "ADMIN" ? "/admin" : "/customer/dashboard"}
          linkLabel={role === "ADMIN" ? `${APP_NAME} admin` : `${APP_NAME} dashboard`}
          onClick={onNavigate}
        />
        {role === "ADMIN" ? (
          <Badge variant="secondary" size="sm">
            Admin
          </Badge>
        ) : null}
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={`${section.title}-${item.href}-${item.label}`}>
                  <SidebarLink item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-3 border-t border-line p-3">
        <p className="flex items-start gap-2 rounded-lg bg-warning-light/50 p-2.5 text-[11px] leading-relaxed text-warning-dark dark:text-warning-light">
          <Sparkles className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {DEMO_NOTICE_SHORT}
        </p>

        <ul className="space-y-0.5">
          <li>
            <Link
              href="/help"
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <LifeBuoy className="size-4 shrink-0" aria-hidden="true" />
              Help centre
              <ExternalLink className="ml-auto size-3.5 shrink-0 opacity-60" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-error-light hover:text-error focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const { data: unreadCount = 0 } = useUnreadCount({ enabled: item.label === "Notifications" });
  const showUnread = item.label === "Notifications" && unreadCount > 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        active
          ? "bg-primary-light text-primary dark:bg-primary/15 dark:text-primary-light"
          : "text-ink-secondary hover:bg-muted hover:text-ink",
      )}
    >
      {active ? (
        <span
          className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary"
          aria-hidden="true"
        />
      ) : null}
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <Badge variant="warning" size="sm">
          {item.badge}
        </Badge>
      ) : showUnread ? (
        <Badge variant="primary" size="sm" srLabel="unread notifications">
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      ) : null}
    </Link>
  );
}

/** Collapsed icon rail used at `lg` and up when the shell is toggled. */
export function AppSidebarRail({ className }: { className?: string }) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const sections = React.useMemo(() => navFor(role), [role]);

  const items = React.useMemo(() => {
    const seen = new Set<string>();
    return sections.flatMap((section) =>
      section.items.filter((item) => {
        if (seen.has(item.href)) return false;
        seen.add(item.href);
        return true;
      }),
    );
  }, [sections]);

  return (
    <nav
      aria-label="Main navigation"
      className={cn("flex w-16 flex-col items-center gap-1 border-r border-line bg-card py-4", className)}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={`rail-${item.href}`}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              active
                ? "bg-primary-light text-primary dark:bg-primary/15 dark:text-primary-light"
                : "text-ink-muted hover:bg-muted hover:text-ink",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </Link>
        );
      })}
      <Separator className="my-2 w-8" />
      <Link
        href="/"
        title="Public site"
        aria-label="Back to public site"
        className="flex size-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>
    </nav>
  );
}
