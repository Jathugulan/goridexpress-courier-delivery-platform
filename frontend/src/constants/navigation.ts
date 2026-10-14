import type { Role } from "@/types";
import {
  BarChart3,
  Bell,
  Bike,
  Car,
  CreditCard,
  Gauge,
  Gift,
  Headset,
  LayoutDashboard,
  LifeBuoy,
  Map,
  Package,
  ReceiptIndianRupee,
  Settings,
  Tag,
  Ticket,
  Truck,
  User,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Show a small "new" pill — used for features still coming soon. */
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const CUSTOMER_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
      { label: "Track delivery", href: "/customer/orders", icon: Map },
    ],
  },
  {
    title: "Deliveries",
    items: [
      { label: "Send a parcel", href: "/customer/delivery/create", icon: Package },
      { label: "My orders", href: "/customer/orders", icon: Truck },
      { label: "Payments", href: "/customer/payments", icon: ReceiptIndianRupee },
      { label: "Wallet", href: "/customer/wallet", icon: Wallet },
      { label: "Coupons", href: "/customer/coupons", icon: Gift },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Notifications", href: "/customer/notifications", icon: Bell },
      { label: "Support", href: "/customer/support", icon: Headset },
      { label: "Profile", href: "/customer/profile", icon: User },
      { label: "Settings", href: "/customer/settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: "/admin", icon: Gauge },
      { label: "Live deliveries", href: "/admin/deliveries/live", icon: Map },
      { label: "Orders", href: "/admin/orders", icon: Package },
      { label: "Couriers", href: "/admin/couriers", icon: Bike },
      { label: "Vehicles", href: "/admin/vehicles", icon: Car },
    ],
  },
  {
    title: "Commercial",
    items: [
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { label: "Promotions", href: "/admin/promotions", icon: Tag },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Support", href: "/admin/support", icon: LifeBuoy },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Admin profile", href: "/admin/settings", icon: UserCog },
    ],
  },
];

export function navFor(role: Role | null | undefined): NavSection[] {
  return role === "ADMIN" ? ADMIN_NAV : CUSTOMER_NAV;
}
