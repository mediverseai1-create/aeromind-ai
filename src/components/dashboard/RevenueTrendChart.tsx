"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/analytics/compute";

export default function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E5BFF" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#2E5BFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,27,42,.08)" vertical={false} />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#A7B3C1" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#A7B3C1" }} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(14,27,42,.10)", fontSize: 13 }}
          formatter={(value: number) => [value.toLocaleString(undefined, { maximumFractionDigits: 0 }), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#2E5BFF" strokeWidth={2.4} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
