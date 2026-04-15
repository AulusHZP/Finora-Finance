const paymentMethods = [
  { name: "Cartão de Crédito", amount: 1240, pct: 42, color: "bg-blue-500", icon: "💳" },
  { name: "Cartão de Débito", amount: 680, pct: 23, color: "bg-green-500", icon: "🏟" },
  { name: "Pix", amount: 560, pct: 19, color: "bg-purple-500", icon: "📱" },
  { name: "Dinheiro", amount: 350, pct: 12, color: "bg-amber-500", icon: "💵" },
];

export function PaymentMethodBreakdown() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3.5">Métodos de Pagamento</h3>

      <div className="flex gap-1 h-2.5 rounded-full overflow-hidden mb-4">
        {paymentMethods.map((m) => (
          <div
            key={m.name}
            className={`${m.color} transition-all`}
            style={{ width: `${m.pct}%` }}
            title={`${m.name}: ${m.pct}%`}
          />
        ))}
      </div>

      <div className="space-y-2">
        {paymentMethods.map((m) => (
          <div key={m.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm">{m.icon}</span>
              <span className="text-foreground font-medium">{m.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">${m.amount}</span>
              <span className="text-muted-foreground w-6 text-right">{m.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
