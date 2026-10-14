"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "@/types";
import { cn } from "@/lib/utils";

/* --------------------------------- Tokens --------------------------------- */

export const CHART_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#16A34A",
  "#F59E0B",
  "#DC2626",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
] as const;

const AXIS_STYLE = { fontSize: 11, fill: "currentColor" } as const;

/* -------------------------------- Tooltip --------------------------------- */

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: string | number;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-card">
      {label ? <p className="mb-1 font-semibold text-ink">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 text-ink-muted">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span>
              {formatter
                ? formatter(Number(entry.value), entry.name ?? String(entry.dataKey))
                : `${entry.name}: ${entry.value}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Area trend -------------------------------- */

export function TrendAreaChart({
  data,
  valueKey = "value",
  dataKey = "value",
  color = CHART_COLORS[0],
  height = 260,
  valueFormatter,
  className,
}: {
  data: TimeSeriesPoint[];
  valueKey?: string;
  dataKey?: string;
  color?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}) {
  if (!data.length) return <EmptyPlot height={height} />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            content={<ChartTooltip formatter={valueFormatter ? (v) => valueFormatter(v) : undefined} />}
            cursor={{ stroke: color, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            name={valueKey}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------- Bars ------------------------------------- */

export function CategoryBarChart({
  data,
  height = 260,
  valueFormatter,
  horizontal = false,
  className,
}: {
  data: { name: string; value: number }[];
  height?: number;
  valueFormatter?: (value: number) => string;
  horizontal?: boolean;
  className?: string;
}) {
  if (!data.length) return <EmptyPlot height={height} />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, bottom: 0, left: horizontal ? 8 : -18 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            opacity={0.1}
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {horizontal ? (
            <>
              <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                width={96}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={48} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "currentColor", opacity: 0.06 }}
            content={<ChartTooltip formatter={valueFormatter ? (v) => valueFormatter(v) : undefined} />}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------- Donut ------------------------------------ */

export function DonutChart({
  data,
  height = 240,
  valueFormatter,
  centerLabel,
  centerValue,
  className,
}: {
  data: { name: string; value: number }[];
  height?: number;
  valueFormatter?: (value: number) => string;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  if (!data.length) return <EmptyPlot height={height} />;

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="86%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={valueFormatter ? (v) => valueFormatter(v) : undefined} />} />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-[11px] text-ink-muted">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center">
          <p className="text-lg font-bold text-ink">{centerValue}</p>
          {centerLabel ? <p className="text-[11px] text-ink-muted">{centerLabel}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ Multi line -------------------------------- */

export function MultiLineChart({
  data,
  series,
  height = 260,
  valueFormatter,
  className,
}: {
  data: Record<string, unknown>[];
  series: { key: string; label: string; color?: string }[];
  height?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}) {
  if (!data.length) return <EmptyPlot height={height} />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<ChartTooltip formatter={valueFormatter ? (v) => valueFormatter(v) : undefined} />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-[11px] text-ink-muted">{value}</span>}
          />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------- Sparkline -------------------------------- */

export function Sparkline({
  data,
  color = CHART_COLORS[0],
  height = 40,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) return <div style={{ height }} className={className} aria-hidden="true" />;

  const points = data
    .map((value, i) => `${(i / (data.length - 1)) * 100},${100 - ((value - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * 100}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
      className={cn("w-full", className)}
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* -------------------------------- Helpers --------------------------------- */

function EmptyPlot({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="flex w-full items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-muted"
    >
      Not enough data in this range.
    </div>
  );
}
