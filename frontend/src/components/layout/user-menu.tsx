"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LogOut,
  Map,
  Plus,
  ShieldCheck,
  User as UserIcon,
  Wallet as WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/auth-store";
import { useLogout, useUnreadCount } from "@/hooks/queries";
import { roleHome } from "@/lib/api/auth";
import { formatCurrency } from "@/lib/format";

/* ======================================================================== */
/*                              Notification bell                           */
/* ======================================================================== */

export function NotificationBell({ className }: { className?: string }) {
  const { data: count = 0 } = useUnreadCount();
  const href = useAuthStore((s) => (s.role === "ADMIN" ? "/admin/notifications" : "/customer/notifications"));

  return (
    <Link
      href={href}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-[10px] text-ink-secondary transition-colors hover:bg-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        className,
      )}
    >
      <Bell className="size-[18px]" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-card">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
      {count > 0 ? <span className="sr-only">{count} unread notifications</span> : null}
    </Link>
  );
}

/* ======================================================================== */
/*                                 User menu                                 */
/* ======================================================================== */

export function UserMenu({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();

  if (!user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="hidden xs:inline-flex">
          <Link href="/register">Get started</Link>
        </Button>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const home = roleHome(user.role);
  const name = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "GR";

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${name}`}
          className={cn(
            "flex items-center gap-2 rounded-[10px] p-1 pr-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
            className,
          )}
        >
          <Avatar src={user.profileImage} alt="" size="sm" fallback={initials} />
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[9rem] truncate text-xs font-semibold text-ink">
              {user.firstName}
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              {isAdmin ? "Admin" : "Customer"}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2.5">
          <Avatar src={user.profileImage} alt="" size="sm" fallback={initials} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{name}</span>
            <span className="block truncate text-xs font-normal text-ink-muted">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={home}>
            <UserIcon className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>

        {!isAdmin ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/customer/delivery/create">
                <Plus className="size-4" />
                New delivery
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/customer/orders">
                <Map className="size-4" />
                My orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/customer/wallet">
                <WalletIcon className="size-4" />
                Demo wallet
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/admin/deliveries/live">
              <ShieldCheck className="size-4" />
              Operations center
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <Link href={isAdmin ? "/admin/notifications" : "/customer/notifications"}>
            <Bell className="size-4" />
            Notifications
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={isAdmin ? "/admin/settings" : "/customer/profile"}>
            <UserIcon className="size-4" />
            Profile & settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogout}
          className="text-error focus:bg-error-light focus:text-error"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ======================================================================== */
/*                              Header actions                              */
/* ======================================================================== */

export function HeaderActions({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {user ? <NotificationBell /> : null}
      <UserMenu />
    </div>
  );
}

/* ======================================================================== */
/*                              Mobile CTA row                              */
/* ======================================================================== */

export function MobileAuthCta({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  if (user) return null;
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <Button asChild variant="outline" size="md">
        <Link href="/login">Sign in</Link>
      </Button>
      <Button asChild size="md">
        <Link href="/register">Get started</Link>
      </Button>
    </div>
  );
}

/* ======================================================================== */
/*                              Dashboard shortcut                          */
/* ======================================================================== */

export function DashboardCta({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  const isAdmin = user.role === "ADMIN";
  return (
    <Button asChild size="sm" className={className} rightIcon={<ChevronRight />}>
      <Link href={isAdmin ? "/admin" : "/customer/dashboard"}>
        {isAdmin ? "Admin console" : "My dashboard"}
      </Link>
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Wallet pill                               */
/* -------------------------------------------------------------------------- */

export function WalletPill({ balance }: { balance?: number }) {
  if (balance === undefined) return null;
  return (
    <Badge variant="purple" size="md" srLabel="Demo wallet balance">
      <WalletIcon className="size-3.5" aria-hidden="true" />
      {formatCurrency(balance)}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Back link                                */
/* -------------------------------------------------------------------------- */

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link href={href}>
        <ChevronRight className="size-4 rotate-180" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Icon-only helper                            */
/* -------------------------------------------------------------------------- */

export { IconButton };
