import { prisma } from "../config/prisma";

type DashboardTransaction = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: string;
  isFixed: boolean;
  category: string;
  method: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

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

export type DashboardSummary = {
  incomeTotal: number;
  expenseTotal: number;
  availableBalance: number;
  fixedCostsTotal: number;
  expenseOfIncomeRatio: number;
  fixedCostsRatio: number;
  carryoverBalance: number;
};

export type DashboardData = {
  transactions: DashboardTransaction[];
  goals: DashboardGoal[];
  summary: DashboardSummary;
  generatedAt: string;
};

const DASHBOARD_CACHE_TTL_MS = 30_000;
const dashboardCache = new Map<string, { expiresAt: number; value: DashboardData }>();
const FIXED_COST_REGEX = /(aluguel|moradia|energia|água|agua|internet|assinatura|condomínio|condominio|conta|seguro|plano)/i;

const normalizeAmount = (amount: number) => Math.abs(Number(amount) || 0);

/**
 * Returns start and end of the current month in UTC-agnostic local boundaries.
 * We store dates in UTC but the user operates in local time, so we construct
 * the month boundaries using the server's perspective of "now".
 * To avoid timezone-shift issues we use UTC month math (dates are saved at
 * midnight UTC when the frontend sends "YYYY-MM-DD" as a full ISO string).
 */
const getCurrentMonthBounds = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { start, end };
};

const buildSummary = (
  allTransactions: DashboardTransaction[],
  currentMonthStart: Date
): DashboardSummary => {
  // Split transactions into current month vs previous months
  const currentMonth = allTransactions.filter((t) => t.date >= currentMonthStart);
  const previousMonths = allTransactions.filter((t) => t.date < currentMonthStart);

  // Calculate carryover (surplus from all previous months)
  let prevIncome = 0;
  let prevExpense = 0;
  for (const t of previousMonths) {
    const amount = normalizeAmount(t.amount);
    if (t.type === "income") prevIncome += amount;
    if (t.type === "expense") prevExpense += amount;
  }
  const carryoverBalance = prevIncome - prevExpense;

  // Calculate current month totals
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

  // Available balance = carryover from previous months + current month income - current month expenses
  const effectiveIncome = incomeTotal + (carryoverBalance > 0 ? carryoverBalance : 0);

  return {
    incomeTotal,
    expenseTotal,
    availableBalance: effectiveIncome - expenseTotal,
    fixedCostsTotal,
    expenseOfIncomeRatio: incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0,
    fixedCostsRatio: expenseTotal > 0 ? Math.round((fixedCostsTotal / expenseTotal) * 100) : 0,
    carryoverBalance
  };
};

const buildDashboardValue = (transactions: DashboardTransaction[], goals: DashboardGoal[]): DashboardData => {
  const { start: currentMonthStart } = getCurrentMonthBounds();

  // Sort all transactions newest first
  const sortedTransactions = [...transactions].sort((left, right) => right.date.getTime() - left.date.getTime());
  const sortedGoals = [...goals].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  // Dashboard list shows only CURRENT MONTH transactions
  const currentMonthTransactions = sortedTransactions.filter((t) => t.date >= currentMonthStart);

  return {
    transactions: currentMonthTransactions,
    goals: sortedGoals,
    summary: buildSummary(sortedTransactions, currentMonthStart),
    generatedAt: new Date().toISOString()
  };
};

export const invalidateDashboardCache = (userId: string) => {
  dashboardCache.delete(userId);
};

export const getDashboardByUserId = async (userId: string): Promise<DashboardData> => {
  const cached = dashboardCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const [transactions, goals] = await Promise.all([
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
        category: true,
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
    })
  ]);

  const value = buildDashboardValue(transactions, goals);
  dashboardCache.set(userId, {
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    value
  });

  return value;
};