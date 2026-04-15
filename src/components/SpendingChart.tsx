import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const data = [
  { name: "Mon", amount: 320 },
  { name: "Tue", amount: 180 },
  { name: "Wed", amount: 450 },
  { name: "Thu", amount: 120 },
  { name: "Fri", amount: 580 },
  { name: "Sat", amount: 290 },
  { name: "Sun", amount: 150 },
];

export function SpendingChart() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">This week</p>
          <p className="text-lg font-semibold text-foreground">$2,090.00</p>
        </div>
        <span className="text-xs font-medium text-success bg-success-light px-2.5 py-1 rounded-full">
          -12% vs last week
        </span>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }}
              dy={8}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "none",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [`$${value}`, "Spent"]}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2.5}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
