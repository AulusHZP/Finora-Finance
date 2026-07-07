import { useState } from "react";
import { TrendingUp, TrendingDown, Wallet, PieChart, AlertTriangle, RefreshCw, Target } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/currency";
import type { DashboardSummary } from "@/services/api";
import { BalanceAdjustSheet } from "@/components/BalanceAdjustSheet";

type AlertState = 'healthy' | 'critical';

function getExpenseAlertState(despesas: number, receita: number): AlertState {
  if (receita === 0) return 'healthy'; // If no income, consider healthy to not show false alarms
  return despesas >= receita ? 'critical' : 'healthy';
}

// All numbers come from the server summary (single source of truth) —
// the backend computes them over a rolling 30-day window with carryover.
export function StatCards({ summary }: { summary?: DashboardSummary }) {
  const [adjustOpen, setAdjustOpen] = useState(false);

  const incomeTotal = summary?.incomeTotal ?? 0;
  const expenseTotal = summary?.expenseTotal ?? 0;
  const fixedCostsTotal = summary?.fixedCostsTotal ?? 0;
  const availableTotal = summary?.availableBalance ?? 0;
  const goalsReserved = summary?.goalsReserved ?? 0;
  const carryoverBalance = summary?.carryoverBalance ?? 0;
  const balanceOffset = summary?.balanceOffset ?? 0;
  const fixedCostsRatio = summary?.fixedCostsRatio ?? 0;
  const expenseOfIncomeRatio = summary?.expenseOfIncomeRatio ?? 0;

  // Build the carryover label for the Disponível card
  const carryoverLabel =
    carryoverBalance > 0
      ? `+${formatCurrencyBRL(carryoverBalance)} de períodos anteriores`
      : carryoverBalance < 0
        ? `${formatCurrencyBRL(carryoverBalance)} de períodos anteriores`
        : "";

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5">

      {/* 1. DISPONÍVEL (Hero Card) — Clickable to adjust balance */}
      <button
        type="button"
        onClick={() => setAdjustOpen(true)}
        className="group col-span-1 md:col-span-6 lg:col-span-5 rounded-2xl bg-primary/70 backdrop-blur-md border border-white/30 dark:border-white/10 p-4 lg:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer text-center flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden"
      >
        {/* Abstract shapes for premium feel */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-125 duration-700 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-black/10 blur-xl transition-transform group-hover:scale-125 duration-700 pointer-events-none" />

        {/* Sync hint badge */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/10">
          <RefreshCw className="h-2.5 w-2.5" />
          Atualizar
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-sm">
               <Wallet className="h-4 w-4 text-white" />
             </div>
             <span className="text-sm font-medium text-primary-foreground/90">Saldo Disponível</span>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums drop-shadow-sm text-white">
              {formatCurrencyBRL(availableTotal)}
            </p>
            {goalsReserved > 0 && (
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm text-xs font-semibold text-white shadow-sm border border-white/10">
                <Target className="h-3 w-3 text-white" />
                {formatCurrencyBRL(goalsReserved)} guardados em metas
              </div>
            )}
            {carryoverLabel && (
              <div className="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm text-xs font-medium text-white/95 shadow-sm border border-white/10">
                 {carryoverBalance > 0 ? <TrendingUp className="h-3 w-3 text-white" /> : <TrendingDown className="h-3 w-3 text-white" />}
                 {carryoverLabel}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* 2 & 3. RECEITA E DESPESAS (Stacked Column) */}
      <div className="col-span-1 md:col-span-6 lg:col-span-4 flex flex-col gap-4 lg:gap-5">

        {/* RECEITA */}
        <div className="group flex-1 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/70 dark:border-white/10 p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
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
        {(() => {
          const alertState = getExpenseAlertState(expenseTotal, incomeTotal);
          const isCritical = alertState === 'critical';
          const showRatio = incomeTotal > 0;

          return (
            <div className="group flex-1 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/70 dark:border-white/10 p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
              <div className="flex justify-between items-start mb-2 transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isCritical ? 'bg-destructive/15 group-hover:bg-destructive/20' : 'bg-blue-500/15 group-hover:bg-blue-500/20'
                  }`}>
                    {isCritical ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Despesas
                  </span>
                </div>
                {showRatio && isCritical && (
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md transition-all duration-300">
                    {expenseOfIncomeRatio}% <span className="hidden sm:inline font-medium">da receita</span>
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold tracking-tight tabular-nums mt-1 mb-3 transition-colors duration-300 ${isCritical ? 'text-destructive' : 'text-foreground'}`}>
                {formatCurrencyBRL(expenseTotal)}
              </p>

              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${isCritical ? 'bg-destructive' : 'bg-blue-500'}`}
                  style={{ width: `${isCritical ? 100 : Math.min(expenseOfIncomeRatio, 100)}%` }}
                />
              </div>
            </div>
          );
        })()}

      </div>

      {/* 4. CUSTOS FIXOS */}
      <div className="group col-span-1 md:col-span-12 lg:col-span-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/70 dark:border-white/10 p-4 lg:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[140px]">
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

    <BalanceAdjustSheet
      open={adjustOpen}
      onClose={() => setAdjustOpen(false)}
      currentBalance={availableTotal}
      currentOffset={balanceOffset}
      reservedInGoals={goalsReserved}
    />
    </>
  );
}
