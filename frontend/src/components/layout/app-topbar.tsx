"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Command,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useLogout, useUnreadCount } from "@/hooks/queries";
import { fullName, initials } from "@/lib/api/auth";
import { Avatar } from "@/components/ui/display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/select";
import { ThemeToggle } from "./theme-toggle";
import { AppSidebar } from "./app-sidebar";
import { DEMO_NOTICE_SHORT } from "@/constants/design";

const TITLES: Record<string, string> = {
  "/customer/dashboard": "Dashboard",
  "/customer/delivery/create": "Send a parcel",
  "/customer/orders": "My orders",
  "/customer/payments": "Payments",
  "/customer/wallet": "Wallet",
  "/customer/coupons": "Coupons",
  "/customer/notifications": "Notifications",
  "/customer/support": "Support",
  "/customer/profile": "Profile",
  "/customer/settings": "Settings",
  "/admin": "Operations dashboard",
  "/admin/deliveries/live": "Live deliveries",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/couriers": "Couriers",
  "/admin/vehicles": "Vehicles",
  "/admin/payments": "Payments",
  "/admin/coupons": "Coupons",
  "/admin/promotions": "Promotions",
  "/admin/support": "Support",
  "/admin/notifications": "Notifications",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
};

function titleFor(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES)
    .filter((key) => key !== "/admin" && pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? TITLES[match] : "GoRideXpress";
}

export function AppTopbar({
  title,
  description,
  actions,
  searchPlaceholder = "Search orders, couriers…",
  onOpenNav,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  onOpenNav?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount = 0 } = useUnreadCount();
  const { mutate: logout } = useLogout();
  const [query, setQuery] = React.useState("");

  const heading = title ?? titleFor(pathname);
  const isAdmin = user?.role === "ADMIN";
  const notificationsHref = isAdmin ? "/admin/notifications" : "/customer/notifications";

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    router.push(`${isAdmin ? "/admin/orders" : "/customer/orders"}?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile nav */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation menu"
              onClick={onOpenNav}
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[19rem] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <AppSidebar className="h-full border-r-0" />
          </SheetContent>
        </Sheet>

        {/* Heading */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-ink sm:text-lg">{heading}</h1>
          {description ? (
            <p className="hidden truncate text-xs text-ink-muted sm:block">{description}</p>
          ) : null}
        </div>

        {/* Search */}
        <form onSubmit={onSearch} role="search" className="hidden lg:block">
          <label htmlFor="app-search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              id="app-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-64 rounded-xl border border-line bg-muted/50 pl-9 pr-14 text-sm text-ink outline-none transition-all placeholder:text-ink-muted focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
            />
            <kbd
              className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-line bg-card px-1.5 py-0.5 text-[10px] font-medium text-ink-muted xl:flex"
              aria-hidden="true"
            >
              <Command className="size-2.5" />K
            </kbd>
          </div>
        </form>

        {actions ? <div className="hidden items-center gap-2 sm:flex">{actions}</div> : null}

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild aria-label="Notifications">
          <Link href={notificationsHref} className="relative">
            <Bell />
            {unreadCount > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </Button>

        <ThemeToggle />

        {/* Account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl p-0.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Account menu"
            >
              <Avatar
                src={user?.profileImage}
                alt={fullName(user)}
                fallback={initials(user)}
                size="sm"
              />
              <span className="hidden max-w-32 truncate text-sm font-medium text-ink xl:block">
                {user?.firstName ?? "Account"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <span className="block text-sm font-semibold text-ink">{fullName(user)}</span>
              <span className="block truncate text-xs font-normal text-ink-muted">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <MenuLink
              href={isAdmin ? "/admin/settings" : "/customer/profile"}
              icon={User}
              label="Profile"
            />
            {!isAdmin ? <MenuLink href="/customer/wallet" icon={Wallet} label="Wallet" /> : null}
            <MenuLink href={notificationsHref} icon={Bell} label="Notifications" />
            <MenuLink href={isAdmin ? "/admin/settings" : "/customer/settings"} icon={Settings} label="Settings" />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => logout()}
              className="text-error focus:bg-error-light focus:text-error"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {actions ? (
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 sm:hidden">{actions}</div>
      ) : null}
    </header>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <DropdownMenuItem asChild>
      <Link href={href}>
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </DropdownMenuItem>
  );
}

export function DemoBanner({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-2 border-b border-warning/30 bg-warning-light/50 px-4 py-1.5 text-[11px] font-medium text-warning-dark dark:text-warning-light",
        className,
      )}
    >
      <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
      {DEMO_NOTICE_SHORT}
      <Badge variant="warning" size="sm">
        No real payments
      </Badge>
    </p>
  );
}
