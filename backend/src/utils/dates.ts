/**
 * Adds months to a date clamping the day to the last day of the target month
 * (e.g. Jan 31 + 1 month = Feb 28, not Mar 3).
 */
export const addMonthsClamped = (date: Date, monthsToAdd: number): Date => {
  const nextDate = new Date(date);
  const originalDay = nextDate.getDate();
  nextDate.setDate(1);
  nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
  const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
  nextDate.setDate(Math.min(originalDay, lastDayOfMonth));
  return nextDate;
};

const lastDayOfUtcMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/**
 * Given an occurrence date, returns the next monthly occurrence targeting
 * `dayOfMonth`, clamped to the length of the following month. Times are set
 * to 12:00 UTC so the calendar day is stable across timezones.
 */
export const nextMonthlyOccurrence = (from: Date, dayOfMonth: number): Date => {
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() + 1;
  const day = Math.min(dayOfMonth, lastDayOfUtcMonth(year, month));
  return new Date(Date.UTC(year, month, day, 12));
};

export type InvoiceWindow = {
  /** Start (exclusive) of the invoice period. */
  opensAfter: Date;
  /** End (inclusive) of the invoice period — the closing date. */
  closesOn: Date;
};

/**
 * Computes the current and next credit card invoice windows for a closing day.
 * A purchase belongs to the invoice whose window contains its date:
 * (previousClosing, closing]. Purchases on the closing day count in that invoice.
 */
export const getInvoiceWindows = (
  closingDay: number,
  reference: Date = new Date()
): { current: InvoiceWindow; next: InvoiceWindow } => {
  const closingForMonth = (year: number, month: number): Date => {
    const day = Math.min(closingDay, lastDayOfUtcMonth(year, month));
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  };

  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();

  let currentClose = closingForMonth(year, month);
  if (reference > currentClose) {
    currentClose = closingForMonth(year, month + 1);
  }

  const prevMonthAnchor = new Date(Date.UTC(currentClose.getUTCFullYear(), currentClose.getUTCMonth() - 1, 1));
  const previousClose = closingForMonth(prevMonthAnchor.getUTCFullYear(), prevMonthAnchor.getUTCMonth());
  const nextMonthAnchor = new Date(Date.UTC(currentClose.getUTCFullYear(), currentClose.getUTCMonth() + 1, 1));
  const nextClose = closingForMonth(nextMonthAnchor.getUTCFullYear(), nextMonthAnchor.getUTCMonth());

  return {
    current: { opensAfter: previousClose, closesOn: currentClose },
    next: { opensAfter: currentClose, closesOn: nextClose }
  };
};
