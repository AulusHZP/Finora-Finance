import { AppLayout } from "@/components/AppLayout";
import { CreditCard, Smartphone } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const methods = [
  { name: "Visa •••• 4532", icon: CreditCard, spent: 1850, color: "hsl(213, 94%, 68%)" },
  { name: "Apple Pay", icon: Smartphone, spent: 920, color: "hsl(160, 64%, 52%)" },
  { name: "Mastercard •••• 7891", icon: CreditCard, spent: 510, color: "hsl(258, 70%, 76%)" },
];

const total = methods.reduce((s, m) => s + m.spent, 0);

const Cards = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Payment Methods</h1>
        <p className="text-sm text-muted-foreground mt-1">Spending by card</p>
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="h-[180px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={methods}
                dataKey="spent"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                strokeWidth={0}
              >
                {methods.map((m, i) => (
                  <Cell key={i} fill={m.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-muted-foreground">Total: ${total.toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        {methods.map((m) => {
          const pct = Math.round((m.spent / total) * 100);
          return (
            <div key={m.name} className="glass-card p-4 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <m.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{pct}%</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">${m.spent.toLocaleString()}</p>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Cards;
