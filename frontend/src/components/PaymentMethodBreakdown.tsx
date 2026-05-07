import { useMemo, useState } from "react";
import { formatCurrencyBRL } from "@/lib/currency";
import type { Transaction } from "@/services/api";

const methodColors = ["bg-blue-500", "bg-emerald-500", "bg-cyan-500", "bg-amber-500", "bg-rose-500", "bg-slate-500"];
import { CreditCard, Landmark, Smartphone, Banknote, Download, HelpCircle } from "lucide-react";

const methodIcons: Record<string, any> = {
  "Crédito": CreditCard,
  "Débito": CreditCard,
  "Transferência": Landmark,
  "Pix": Smartphone,
  "Dinheiro": Banknote,
  "Importação CSV": Download,
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
  const [tab, setTab] = useState<'month' | 'total'>('month');

  const paymentMethods = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const grouped = transactions
      .filter((tx) => {
        if (tx.type !== "expense") return false;
        
        if (tab === 'month') {
          const datePart = tx.date.split("T")[0];
          const [year, month] = datePart.split("-").map(Number);
          if (year !== currentYear || month - 1 !== currentMonth) return false;
        }
        
        return true;
      })
      .reduce<Record<string, number>>((acc, tx) => {
        const method = tx.method || "Outros";
        acc[method] = (acc[method] || 0) + Math.abs(Number(tx.amount) || 0);
        return acc;
      }, {});

    const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(grouped)
      .map(([name, amount], index) => ({
        name: methodLabelMap[name] || name,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: methodColors[index % methodColors.length],
        icon: methodIcons[name] || HelpCircle,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, tab]);

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/5 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-lg font-semibold text-foreground">Métodos de Pagamento</h2>
        <div className="flex bg-muted p-1 rounded-lg w-fit shrink-0">
          <button 
            onClick={() => setTab('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${tab === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Mês Atual
          </button>
          <button 
            onClick={() => setTab('total')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${tab === 'total' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Total
          </button>
        </div>
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
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.name}</p>
                      <p className="text-xs font-medium text-muted-foreground">{m.pct}% das despesas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-foreground font-semibold">{formatCurrencyBRL(m.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
