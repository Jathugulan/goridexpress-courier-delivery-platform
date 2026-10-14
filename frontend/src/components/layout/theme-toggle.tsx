"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/select";
import { useTheme, type ThemeMode } from "@/components/providers/theme-provider";

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, resolvedTheme, setMode, toggle } = useTheme();
  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Theme: ${mode}. Change theme`}
          className={className}
          onClick={(e) => {
            // Left click cycles light → dark → system for quick toggling.
            if (e.detail === 0) toggle();
          }}
        >
          <TriggerIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ mode: value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setMode(value)}
            aria-checked={mode === value}
            className={mode === value ? "bg-primary-light text-primary-dark dark:text-primary-light" : undefined}
          >
            <Icon className="size-4" />
            {label}
            {mode === value ? <span className="ml-auto text-xs font-bold">✓</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
