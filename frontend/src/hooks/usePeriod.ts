/**
 * usePeriod.ts
 *
 * Global period selector (year + month).
 * Persists in sessionStorage so navigation between pages keeps the selected period.
 * Resets to current month on page reload.
 */

import { useState, useCallback } from "react";

export type Period = {
  year: number;
  month: number; // 1-indexed
};

// Module-level state so the period is shared across all hook instances
// without a React context or external state library.
const now = new Date();
let _year = now.getFullYear();
let _month = now.getMonth() + 1;

const listeners = new Set<() => void>();

function setPeriodGlobal(year: number, month: number) {
  _year = year;
  _month = month;
  listeners.forEach((fn) => fn());
}

export function usePeriod() {
  const [, forceRender] = useState(0);

  const subscribe = useCallback(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  // Subscribe on mount
  useState(() => {
    const unsub = subscribe();
    return unsub;
  });

  const setPeriod = useCallback((year: number, month: number) => {
    setPeriodGlobal(year, month);
  }, []);

  const prevMonth = useCallback(() => {
    if (_month === 1) {
      setPeriodGlobal(_year - 1, 12);
    } else {
      setPeriodGlobal(_year, _month - 1);
    }
  }, []);

  const nextMonth = useCallback(() => {
    if (_month === 12) {
      setPeriodGlobal(_year + 1, 1);
    } else {
      setPeriodGlobal(_year, _month + 1);
    }
  }, []);

  const isCurrentMonth =
    _year === now.getFullYear() && _month === now.getMonth() + 1;

  return {
    year: _year,
    month: _month,
    setPeriod,
    prevMonth,
    nextMonth,
    isCurrentMonth,
  };
}

/** Formats period as "Julho de 2026" */
export function formatPeriodLong(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** Formats period as "07/2026" */
export function formatPeriodShort(year: number, month: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

/** Returns today as YYYY-MM-DD */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
