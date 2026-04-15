const categories = [
  { name: "Food & Dining", amount: 820, pct: 25, color: "bg-chart-blue" },
  { name: "Transport", amount: 540, pct: 16, color: "bg-chart-green" },
  { name: "Shopping", amount: 680, pct: 21, color: "bg-chart-purple" },
  { name: "Bills & Utilities", amount: 840, pct: 26, color: "bg-primary" },
  { name: "Entertainment", amount: 400, pct: 12, color: "bg-chart-gray" },
];

export function SpendingBreakdown() {
  return (
    <div className="glass-card p-5 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-1">Spending by Category</h3>
      <p className="text-xs text-muted-foreground mb-4">This month's breakdown</p>
      
      <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-5">
        {categories.map((c) => (
          <div key={c.name} className={`${c.color} transition-all`} style={{ width: `${c.pct}%` }} />
        ))}
      </div>

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
              <span className="text-sm text-foreground">{c.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">${c.amount}</span>
              <span className="text-xs text-muted-foreground w-8 text-right">{c.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
