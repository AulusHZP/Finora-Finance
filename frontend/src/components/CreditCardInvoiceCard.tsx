import { CreditCard } from "lucide-react";
import type { CreditCardSummary } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

const formatClosingDate = (iso: string) => {
  const datePart = iso.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  });
};

export function CreditCardInvoiceCard({ creditCard }: { creditCard: CreditCardSummary }) {
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/70 dark:border-white/10 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-violet-500/15 flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-violet-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Cartão de Crédito</h3>
          <p className="text-[11px] text-muted-foreground">Fecha todo dia {creditCard.closingDay}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Fatura atual</p>
          <p className="text-lg font-bold tracking-tight tabular-nums text-foreground">
            {formatCurrencyBRL(creditCard.currentInvoiceTotal)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            fecha em {formatClosingDate(creditCard.currentClosesOn)}
          </p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Próxima fatura</p>
          <p className="text-lg font-bold tracking-tight tabular-nums text-foreground">
            {formatCurrencyBRL(creditCard.nextInvoiceTotal)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">inclui parcelas futuras</p>
        </div>
      </div>
    </div>
  );
}
