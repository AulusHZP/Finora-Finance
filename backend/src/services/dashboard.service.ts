import { prisma } from "../config/prisma";

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

export type DashboardSummary = {
  incomeTotal: number;
  expenseTotal: number;
  availableBalance: number;
  fixedCostsTotal: number;
  expenseOfIncomeRatio: number;
  fixedCostsRatio: number;
  carryoverBalance: number;
  balanceOffset: number;
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

const buildSummary = (
  allTransactions: DashboardTransaction[],
  currentMonthStart: Date,
  balanceOffset: number
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

  // Available balance = carryover from previous months + current month income - current month expenses + manual offset
  const effectiveIncome = incomeTotal + (carryoverBalance > 0 ? carryoverBalance : 0);

  return {
    incomeTotal,
    expenseTotal,
    availableBalance: effectiveIncome - expenseTotal + balanceOffset,
    fixedCostsTotal,
    expenseOfIncomeRatio: incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0,
    fixedCostsRatio: expenseTotal > 0 ? Math.round((fixedCostsTotal / expenseTotal) * 100) : 0,
    carryoverBalance,
    balanceOffset
  };
};

const buildDashboardValue = (transactions: DashboardTransaction[], goals: DashboardGoal[], balanceOffset: number): DashboardData => {
  const { start: currentMonthStart } = getCurrentMonthBounds();

  // Sort all transactions newest first
  const sortedTransactions = [...transactions].sort((left, right) => right.date.getTime() - left.date.getTime());
  const sortedGoals = [...goals].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return {
    // Return ALL transactions so the chart / insights components have full historical data.
    // The frontend components (TransactionTable, SpendingChart) apply their own date filtering.
    transactions: sortedTransactions,
    goals: sortedGoals,
    // Summary is still scoped to the current month (with carryover from previous months).
    summary: buildSummary(sortedTransactions, currentMonthStart, balanceOffset),
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

  const [transactions, goals, user] = await Promise.all([
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
    }).then((rows) =>
      rows.map((t) => ({ ...t, category: t.category?.name ?? "" }))
    ),
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
    prisma.user.findUnique({
      where: { id: userId },
      select: { balanceOffset: true }
    })
  ]);

  const balanceOffset = user?.balanceOffset ?? 0;
  const value = buildDashboardValue(transactions, goals, balanceOffset);
  dashboardCache.set(userId, {
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    value
  });

  return value;
};