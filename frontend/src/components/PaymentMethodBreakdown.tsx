import { formatCurrencyBRL } from "@/lib/currency";
import type { Transaction } from "@/services/api";

const methodColors = ["bg-blue-500", "bg-emerald-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500", "bg-slate-500"];
const methodIcons: Record<string, string> = {
  "Crédito": "💳",
  "Débito": "💳",
  "Transferência": "🏦",
  "Pix": "📱",
  "Dinheiro": "💵",
  "Importação CSV": "📥",
};

const methodLabelMap: Record<string, string> = {
  "Crédito": "Cartão de Crédito",
  "Débito": "Cartão de Débito",
  "Transferência": "Transferência",
  "Pix": "Pix",
  "Dinheiro": "Dinheiro",
  "Importação CSV": "Importação CSV",
};

export function PaymentMethodBreakdown({ transactions }: { transactions: Transaction[] }) {
  const grouped = transactions
    .filter((tx) => tx.type === "expense")
    .reduce<Record<string, number>>((acc, tx) => {
      const method = tx.method || "Outros";
      acc[method] = (acc[method] || 0) + Math.abs(Number(tx.amount) || 0);
      return acc;
    }, {});

  const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

  const paymentMethods = Object.entries(grouped)
    .map(([name, amount], index) => ({
      name,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: methodColors[index % methodColors.length],
      icon: methodIcons[name] || "💰",
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3.5">Métodos de Pagamento</h3>

      {paymentMethods.length === 0 && (
        <p className="text-xs text-muted-foreground mb-3">Sem despesas para detalhar por método.</p>
      )}

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
              <span className="text-foreground font-medium">{methodLabelMap[m.name] || m.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">{formatCurrencyBRL(m.amount)}</span>
              <span className="text-muted-foreground w-6 text-right">{m.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
