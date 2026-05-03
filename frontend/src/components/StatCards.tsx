import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/currency";
import type { Transaction, DashboardSummary } from "@/services/api";

const FIXED_COST_REGEX = /(aluguel|moradia|energia|água|agua|internet|assinatura|condomínio|condominio|conta|seguro|plano)/i;

export function StatCards({
  transactions,
  summary,
}: {
  transactions: Transaction[];
  summary?: DashboardSummary;
}) {
  // If summary is provided by the backend, use it directly (accounts for carryover)
  let incomeTotal: number;
  let expenseTotal: number;
  let fixedCostsTotal: number;
  let availableTotal: number;
  let carryoverBalance: number;

  if (summary) {
    incomeTotal = summary.incomeTotal;
    expenseTotal = summary.expenseTotal;
    fixedCostsTotal = summary.fixedCostsTotal;
    availableTotal = summary.availableBalance;
    carryoverBalance = summary.carryoverBalance ?? 0;
  } else {
    // Fallback: compute from transactions locally (no carryover info)
    incomeTotal = 0;
    expenseTotal = 0;
    fixedCostsTotal = 0;
    carryoverBalance = 0;

    transactions.forEach((tx) => {
      const amount = Math.abs(Number(tx.amount) || 0);
      const isExpense = tx.type === "expense";
      const isIncome = tx.type === "income";

      if (isIncome) {
        incomeTotal += amount;
      }

      if (isExpense) {
        expenseTotal += amount;

        const searchableText = `${tx.title} ${tx.category}`;
        const isTaggedFixed = Boolean(tx.isFixed);
        if (isTaggedFixed || FIXED_COST_REGEX.test(searchableText)) {
          fixedCostsTotal += amount;
        }
      }
    });

    availableTotal = incomeTotal - expenseTotal;
  }

  const fixedCostsRatio = expenseTotal > 0 ? Math.round((fixedCostsTotal / expenseTotal) * 100) : 0;
  const expenseOfIncomeRatio = incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0;

  // Build the carryover label for the Disponível card
  const carryoverLabel =
    carryoverBalance > 0
      ? `+${formatCurrencyBRL(carryoverBalance)} do mês anterior`
      : carryoverBalance < 0
        ? `${formatCurrencyBRL(carryoverBalance)} do mês anterior`
        : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">
      
      {/* 1. DISPONÍVEL (Hero Card) */}
      <div className="group col-span-1 md:col-span-6 lg:col-span-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-5 lg:p-6 text-primary-foreground shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Abstract shapes for premium feel */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-125 duration-700" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-black/10 blur-xl transition-transform group-hover:scale-125 duration-700" />
        
        <div className="relative z-10 flex flex-col h-full justify-center items-center text-center min-h-[140px] py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-sm">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-primary-foreground/90">Saldo Disponível</span>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums drop-shadow-sm">
              {formatCurrencyBRL(availableTotal)}
            </p>
            {carryoverLabel && (
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm text-xs font-medium text-white/95 shadow-sm border border-white/10">
                 {carryoverBalance > 0 ? <TrendingUp className="h-3 w-3 text-white" /> : <TrendingDown className="h-3 w-3 text-white" />}
                 {carryoverLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2 & 3. RECEITA E DESPESAS (Stacked Column) */}
      <div className="col-span-1 md:col-span-6 lg:col-span-4 flex flex-col gap-4 lg:gap-5">
        
        {/* RECEITA */}
        <div className="group flex-1 rounded-2xl bg-card border border-border/50 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
           <div className="flex justify-between items-start mb-2">
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center transition-colors group-hover:bg-success/20">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Receita</span>
             </div>
           </div>
           <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground mt-1">
             {formatCurrencyBRL(incomeTotal)}
           </p>
        </div>

        {/* DESPESAS WITH PROGRESS */}
        <div className="group flex-1 rounded-2xl bg-card border border-border/50 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
           <div className="flex justify-between items-start mb-2">
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-destructive/15 flex items-center justify-center transition-colors group-hover:bg-destructive/20">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Despesas</span>
             </div>
             {incomeTotal > 0 && (
               <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                 {expenseOfIncomeRatio}% <span className="hidden sm:inline font-medium">da receita</span>
               </span>
             )}
           </div>
           <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground mt-1 mb-3">
             {formatCurrencyBRL(expenseTotal)}
           </p>
           
           <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
             <div 
               className="bg-destructive h-full rounded-full transition-all duration-1000 ease-out" 
               style={{ width: `${Math.min(expenseOfIncomeRatio, 100)}%` }}
             />
           </div>
        </div>

      </div>

      {/* 4. CUSTOS FIXOS */}
      <div className="group col-span-1 md:col-span-12 lg:col-span-3 rounded-2xl bg-card border border-border/50 p-4 lg:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="h-8 w-8 rounded-full bg-blue-500/15 flex items-center justify-center transition-colors group-hover:bg-blue-500/20">
                  <PieChart className="h-4 w-4 text-blue-500" />
               </div>
               <span className="text-sm font-semibold text-muted-foreground">Custos Fixos</span>
            </div>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground mb-1">
              {formatCurrencyBRL(fixedCostsTotal)}
            </p>
          </div>
          
          {expenseTotal > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-left">Impacto</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{fixedCostsRatio}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(fixedCostsRatio, 100)}%` }}
                />
              </div>
            </div>
          )}
      </div>

    </div>
  );
}
