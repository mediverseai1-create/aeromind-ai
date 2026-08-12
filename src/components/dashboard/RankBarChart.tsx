"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Ranked } from "@/lib/analytics/compute";

export default function RankBarChart({ data }: { data: Ranked[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,27,42,.08)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#A7B3C1" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 12, fill: "#33445A" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid rgba(14,27,42,.10)", fontSize: 13 }}
          formatter={(value: number) => [value.toLocaleString(undefined, { maximumFractionDigits: 0 }), "Revenue"]}
        />
        <Bar dataKey="revenue" fill="#2E5BFF" radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
