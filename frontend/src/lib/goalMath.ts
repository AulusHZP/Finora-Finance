/**
 * Whole months between `from` and `targetDate` (minimum 1), i.e. how many
 * monthly contributions still fit before the deadline.
 */
export const monthsUntil = (targetDate: Date, from: Date = new Date()): number => {
  const months =
    (targetDate.getFullYear() - from.getFullYear()) * 12 +
    (targetDate.getMonth() - from.getMonth());

  return Math.max(1, months);
};

/**
 * How much to save per month to hit the goal by its target date.
 * Returns null when the goal is complete or has no deadline.
 */
export const suggestedMonthlyContribution = (
  current: number,
  target: number,
  targetDate: Date | null,
  from: Date = new Date()
): number | null => {
  if (!targetDate) return null;

  const remaining = target - current;
  if (remaining <= 0) return null;

  if (targetDate <= from) {
    // Deadline passed (or is this month): the whole remainder is due now.
    return remaining;
  }

  return remaining / monthsUntil(targetDate, from);
};
