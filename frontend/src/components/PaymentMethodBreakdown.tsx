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
    <div className="bg-card rounded-2xl border border-border/50 p-5 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30">
        <h3 className="text-base font-bold text-foreground">Métodos de Pagamento</h3>
      </div>

      {paymentMethods.length === 0 && (
        <p className="text-[13px] text-muted-foreground mb-3 p-4 bg-muted/30 rounded-xl text-center border border-border/40">Sem despesas para detalhar.</p>
      )}

      {paymentMethods.length > 0 && (
        <>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-5">
            {paymentMethods.map((m) => (
              <div
                key={m.name}
                className={`${m.color} transition-all duration-1000 ease-out`}
                style={{ width: `${m.pct}%` }}
                title={`${m.name}: ${m.pct}%`}
              />
            ))}
          </div>

          <div className="space-y-3">
            {paymentMethods.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-sm group hover:bg-muted/30 p-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="text-base h-7 w-7 bg-muted/50 rounded-full flex items-center justify-center group-hover:bg-muted transition-colors">{m.icon}</span>
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors">{methodLabelMap[m.name] || m.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-semibold">{formatCurrencyBRL(m.amount)}</span>
                  <span className="text-muted-foreground font-medium text-xs bg-muted px-2 py-0.5 rounded-full">{m.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
