"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requiredRole="ADMIN">{children}</AppShell>;
}
