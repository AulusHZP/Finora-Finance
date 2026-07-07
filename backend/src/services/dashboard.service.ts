import { prisma } from "../config/prisma";
import { getInvoiceWindows } from "../utils/dates";
import { buildBudgetStatuses, type BudgetStatus } from "./budget.service";
import { hasDueRecurrences, materializeDueRecurringTransactions } from "./recurring.service";

type RawTransaction = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: string;
  isFixed: boolean;
  category: { id: string; name: string; parentId: string | null; createdAt: Date; updatedAt: Date } | null;
  method: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

type DashboardTransaction = Omit<RawTransaction, 'category'> & { category: string };

type DashboardGoal = {
  id: string;
  userId: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
  targetDate: Date | null;
  priority: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreditCardSummary = {
  closingDay: number;
  currentInvoiceTotal: number;
  nextInvoiceTotal: number;
  currentClosesOn: string;
};

export type DashboardSummary = {
  incomeTotal: number;
  expenseTotal: number;
  availableBalance: number;
  spendableBalance: number;
  goalsReserved: number;
  fixedCostsTotal: number;
  expenseOfIncomeRatio: number;
  fixedCostsRatio: number;
  carryoverBalance: number;
  balanceOffset: number;
  creditCard: CreditCardSummary | null;
};

export type DashboardData = {
  transactions: DashboardTransaction[];
  goals: DashboardGoal[];
  budgets: BudgetStatus[];
  summary: DashboardSummary;
  generatedAt: string;
};

const DASHBOARD_CACHE_TTL_MS = 30_000;
const dashboardCache = new Map<string, { expiresAt: number; value: DashboardData }>();
const FIXED_COST_REGEX = /(aluguel|moradia|energia|água|agua|internet|assinatura|condomínio|condominio|conta|seguro|plano)/i;

const normalizeAmount = (amount: number) => Math.abs(Number(amount) || 0);

/**
 * Returns a rolling 30-day window ending today (UTC).
 * Using a rolling window instead of a strict calendar month ensures that
 * income from the previous month is always visible in the summary cards —
 * especially important at the start of a new month when no income has been
 * recorded yet for the current calendar month.
 */
const getCurrentMonthBounds = () => {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000); // last 30 days (today inclusive)
  return { start, end };
};

const buildCreditCardSummary = (
  rawTransactions: RawTransaction[],
  closingDay: number | null
): CreditCardSummary | null => {
  if (!closingDay) return null;

  const { current, next } = getInvoiceWindows(closingDay);

  let currentInvoiceTotal = 0;
  let nextInvoiceTotal = 0;

  for (const tx of rawTransactions) {
    if (tx.type !== "expense" || tx.method !== "Crédito") continue;

    const amount = normalizeAmount(tx.amount);
    if (tx.date > current.opensAfter && tx.date <= current.closesOn) {
      currentInvoiceTotal += amount;
    } else if (tx.date > next.opensAfter && tx.date <= next.closesOn) {
      nextInvoiceTotal += amount;
    }
  }

  return {
    closingDay,
    currentInvoiceTotal,
    nextInvoiceTotal,
    currentClosesOn: current.closesOn.toISOString()
  };
};

const buildSummary = (
  allTransactions: DashboardTransaction[],
  currentMonthStart: Date,
  balanceOffset: number,
  goalsReserved: number,
  creditCard: CreditCardSummary | null
): DashboardSummary => {
  // Split transactions into current window vs previous periods
  const currentMonth = allTransactions.filter((t) => t.date >= currentMonthStart);
  const previousMonths = allTransactions.filter((t) => t.date < currentMonthStart);

  // Calculate carryover (net result of all previous periods)
  let prevIncome = 0;
  let prevExpense = 0;
  for (const t of previousMonths) {
    const amount = normalizeAmount(t.amount);
    if (t.type === "income") prevIncome += amount;
    if (t.type === "expense") prevExpense += amount;
  }
  const carryoverBalance = prevIncome - prevExpense;

  // Calculate current window totals
  let incomeTotal = 0;
  let expenseTotal = 0;
  let fixedCostsTotal = 0;

  for (const transaction of currentMonth) {
    const amount = normalizeAmount(transaction.amount);
    const isIncome = transaction.type === "income";
    const isExpense = transaction.type === "expense";

    if (isIncome) {
      incomeTotal += amount;
    }

    if (isExpense) {
      expenseTotal += amount;

      const searchableText = `${transaction.title} ${transaction.category}`;
      if (transaction.isFixed || FIXED_COST_REGEX.test(searchableText)) {
        fixedCostsTotal += amount;
      }
    }
  }

  // Available balance = carryover from previous periods (positive or negative —
  // overspending in the past reduces what is available today) + current window
  // income - expenses + manual offset. This equals the all-time net + offset.
  // Spendable balance additionally sets aside what is reserved in goals.
  const availableBalance = carryoverBalance + incomeTotal - expenseTotal + balanceOffset;

  return {
    incomeTotal,
    expenseTotal,
    availableBalance,
    spendableBalance: availableBalance - goalsReserved,
    goalsReserved,
    fixedCostsTotal,
    expenseOfIncomeRatio: incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0,
    fixedCostsRatio: expenseTotal > 0 ? Math.round((fixedCostsTotal / expenseTotal) * 100) : 0,
    carryoverBalance,
    balanceOffset,
    creditCard
  };
};

export const invalidateDashboardCache = (userId: string) => {
  dashboardCache.delete(userId);
};

export const getDashboardByUserId = async (userId: string): Promise<DashboardData> => {
  // Materialize due recurring transactions before serving anything. The cheap
  // indexed count keeps the common case (nothing due) at one extra query.
  if (await hasDueRecurrences(userId)) {
    const materialized = await materializeDueRecurringTransactions(userId);
    if (materialized > 0) {
      invalidateDashboardCache(userId);
    }
  }

  const cached = dashboardCache.get(userId);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.value;
    }
    dashboardCache.delete(userId);
  }

  const [rawTransactions, goals, budgets, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        userId: true,
        title: true,
        amount: true,
        type: true,
        isFixed: true,
        category: { select: { id: true, name: true, parentId: true, createdAt: true, updatedAt: true } },
        method: true,
        date: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        title: true,
        current: true,
        target: true,
        emoji: true,
        targetDate: true,
        priority: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { balanceOffset: true, creditCardClosingDay: true }
    })
  ]);

  const balanceOffset = user?.balanceOffset ?? 0;
  const goalsReserved = goals.reduce((sum, goal) => sum + Math.max(0, Number(goal.current) || 0), 0);

  const budgetStatuses = buildBudgetStatuses(budgets, rawTransactions);
  const creditCard = buildCreditCardSummary(rawTransactions, user?.creditCardClosingDay ?? null);

  const transactions: DashboardTransaction[] = rawTransactions.map((t) => ({
    ...t,
    category: t.category?.name ?? ""
  }));

  const { start: currentMonthStart } = getCurrentMonthBounds();
  const sortedTransactions = [...transactions].sort((left, right) => right.date.getTime() - left.date.getTime());
  const sortedGoals = [...goals].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  const value: DashboardData = {
    // Return ALL transactions so the chart / insights components have full historical data.
    // The frontend components (TransactionTable, SpendingChart) apply their own date filtering.
    transactions: sortedTransactions,
    goals: sortedGoals,
    budgets: budgetStatuses,
    // Summary is still scoped to the current window (with carryover from previous periods).
    summary: buildSummary(sortedTransactions, currentMonthStart, balanceOffset, goalsReserved, creditCard),
    generatedAt: new Date().toISOString()
  };

  dashboardCache.set(userId, {
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    value
  });

  return value;
};
