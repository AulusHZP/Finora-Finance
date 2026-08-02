import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePeriod, formatPeriodLong } from "@/hooks/usePeriod";

interface PeriodSelectorProps {
  className?: string;
}

export function PeriodSelector({ className = "" }: PeriodSelectorProps) {
  const { year, month, prevMonth, nextMonth, isCurrentMonth } = usePeriod();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={prevMonth}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm font-medium text-muted-foreground min-w-[140px] text-center capitalize">
        {formatPeriodLong(year, month)}
      </span>

      <button
        onClick={nextMonth}
        disabled={isCurrentMonth}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
