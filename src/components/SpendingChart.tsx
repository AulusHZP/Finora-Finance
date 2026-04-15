import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useState } from "react";

const weeklyData = [
  { name: "Mon", amount: 320 },
  { name: "Tue", amount: 180 },
  { name: "Wed", amount: 450 },
  { name: "Thu", amount: 120 },
  { name: "Fri", amount: 580 },
  { name: "Sat", amount: 290 },
  { name: "Sun", amount: 150 },
];

const monthlyData = [
  { name: "Jan", amount: 2800 },
  { name: "Feb", amount: 3200 },
  { name: "Mar", amount: 2900 },
  { name: "Apr", amount: 3500 },
  { name: "May", amount: 2600 },
  { name: "Jun", amount: 3100 },
];

export function SpendingChart() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const data = period === "weekly" ? weeklyData : monthlyData;

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Spending Overview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {period === "weekly" ? "$2,090 this week" : "$18,100 this half"}
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-default ${
              period === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-default ${
              period === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Month
          </button>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} dx={-8} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [`$${value}`, "Spent"]}
            />
            <Area type="monotone" dataKey="amount" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#colorAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
