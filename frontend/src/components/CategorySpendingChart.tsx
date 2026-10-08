import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { type DonutDataItem } from "@/services/api";
import { formatCurrencyBRL } from "@/lib/currency";

const formatPercent = (amount: number, total: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(total > 0 ? amount / total * 100 : 0)}%`;

export function CategorySpendingChart({ data }: { data: DonutDataItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entries = [...data].sort((a, b) => b.amount - a.amount);
  const total = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const selected = entries.find((entry) => entry.categoryId === selectedId);
  const selectCategory = (id: string) => setSelectedId((current) => current === id ? null : id);

  return (
    <div className="min-w-0">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:flex-col xl:flex-row">
        <div className="relative w-full max-w-64 shrink-0">
          {/* The buttons below provide the same data and selection for keyboard and screen readers. */}
          <div className="category-donut h-64 w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={entries}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="65%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={entries.length > 1 ? 2 : 0}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                  rootTabIndex={-1}
                  isAnimationActive={false}
                  onClick={(_, index) => selectCategory(entries[index].categoryId)}
                >
                  {entries.map((entry) => (
                    <Cell
                      key={entry.categoryId}
                      fill={entry.color}
                      fillOpacity={!selected || selected.categoryId === entry.categoryId ? 1 : 0.25}
                      className="cursor-pointer"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            <div className="w-[58%]" role="status" aria-live="polite" aria-atomic="true">
              <p className="text-xs leading-snug text-muted-foreground break-words">{selected?.name ?? "Total no mês"}</p>
              <p className="mt-1 text-lg font-bold tracking-tight tabular-nums text-foreground break-words">
                {formatCurrencyBRL(selected ? selected.amount : total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected ? `${formatPercent(selected.amount, total)} do total` : `${entries.length} categorias`}
              </p>
            </div>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-1" aria-label="Gastos por categoria">
          {entries.map((entry) => {
            const isSelected = selected?.categoryId === entry.categoryId;
            return (
              <li key={entry.categoryId}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectCategory(entry.categoryId)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSelected ? "bg-muted ring-1 ring-border" : "hover:bg-muted/60"}`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-foreground">{entry.name}</span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block text-sm font-semibold text-foreground">{formatCurrencyBRL(entry.amount)}</span>
                    <span className="block text-xs text-muted-foreground">{formatPercent(entry.amount, total)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Toque em uma categoria para destacar. Toque novamente para ver o total.</p>
    </div>
  );
}
