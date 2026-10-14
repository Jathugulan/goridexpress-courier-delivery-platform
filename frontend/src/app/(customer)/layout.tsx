"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requiredRole="CUSTOMER">{children}</AppShell>;
}
