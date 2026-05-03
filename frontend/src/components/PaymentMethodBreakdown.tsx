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
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5 flex-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Métodos de Pagamento</h2>
      </div>

      {paymentMethods.length === 0 && (
        <p className="text-[13px] text-muted-foreground mb-3 p-4 bg-muted/30 rounded-2xl text-center border border-border/40">Sem despesas para detalhar.</p>
      )}

      {paymentMethods.length > 0 && (
        <div className="flex flex-col h-full">
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-6 shrink-0">
            {paymentMethods.map((m) => (
              <div
                key={m.name}
                className={`${m.color} transition-all duration-1000 ease-out`}
                style={{ width: `${m.pct}%` }}
                title={`${m.name}: ${m.pct}%`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-1 flex-1">
            {paymentMethods.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-sm group hover:bg-muted/50 p-2.5 -mx-2.5 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-base h-8 w-8 bg-muted rounded-xl flex items-center justify-center group-hover:bg-muted/80 transition-colors shrink-0">{m.icon}</span>
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors">{methodLabelMap[m.name] || m.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-foreground font-semibold">{formatCurrencyBRL(m.amount)}</span>
                  <span className="text-muted-foreground font-medium text-xs bg-muted px-2 py-0.5 rounded-md">{m.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
