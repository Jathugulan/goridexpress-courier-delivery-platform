import * as React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/config";

export function Logo({
  href = "/",
  size = "md",
  showText = true,
  tone = "default",
  linkLabel,
  onClick,
  className,
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  /**
   * `light` is for hard-coded dark surfaces (e.g. the auth aside gradient).
   * The default tone follows the theme via `text-ink`, so it is correct on
   * `bg-card` in both light and dark mode — reach for `light` only when the
   * background does not change with the theme.
   */
  tone?: "default" | "light";
  /** Overrides the link's accessible name when it is not the site home. */
  linkLabel?: string;
  /** Used by the sidebar to close the mobile nav on navigate. */
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
}) {
  const markSize = { sm: "size-8", md: "size-9", lg: "size-11" }[size];
  const iconSize = { sm: "size-4", md: "size-[18px]", lg: "size-5" }[size];
  const textSize = { sm: "text-base", md: "text-lg", lg: "text-xl" }[size];
  const isLight = tone === "light";

  const mark = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#1D4ED8] text-white shadow-sm",
        markSize,
      )}
      aria-hidden="true"
    >
      <Zap className={cn(iconSize, "fill-white/90")} />
    </span>
  );

  const wordmark = (
    <span className="min-w-0">
      <span
        className={cn(
          "block font-extrabold leading-none tracking-tight",
          textSize,
          isLight ? "text-white" : "text-ink",
        )}
      >
        GoRide<span className="text-primary">Xpress</span>
      </span>
      {size !== "sm" ? (
        <span
          className={cn(
            "mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em]",
            isLight ? "text-white/70" : "text-ink-muted",
          )}
        >
          {APP_TAGLINE}
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return (
      <span className={cn("flex items-center gap-2.5", className)}>
        {mark}
        {showText ? wordmark : null}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={linkLabel ?? `${APP_NAME} — home`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:outline-none",
        isLight ? "focus-visible:ring-white" : "focus-visible:ring-primary",
        className,
      )}
    >
      {mark}
      {showText ? wordmark : null}
    </Link>
  );
}

export function LogoMarkOnly({
  tone = "default",
  className,
}: {
  tone?: "default" | "light";
  className?: string;
}) {
  return <Logo href={null} showText={false} tone={tone} className={className} />;
}
