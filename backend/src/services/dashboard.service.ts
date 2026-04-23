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

const buildSummary = (transactions: DashboardTransaction[]): DashboardSummary => {
  let incomeTotal = 0;
  let expenseTotal = 0;
  let fixedCostsTotal = 0;

  for (const transaction of transactions) {
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

  return {
    incomeTotal,
    expenseTotal,
    availableBalance: incomeTotal - expenseTotal,
    fixedCostsTotal,
    expenseOfIncomeRatio: incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) : 0,
    fixedCostsRatio: expenseTotal > 0 ? Math.round((fixedCostsTotal / expenseTotal) * 100) : 0
  };
};

const buildDashboardValue = (transactions: DashboardTransaction[], goals: DashboardGoal[]): DashboardData => {
  const sortedTransactions = [...transactions].sort((left, right) => right.date.getTime() - left.date.getTime());
  const sortedGoals = [...goals].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return {
    transactions: sortedTransactions,
    goals: sortedGoals,
    summary: buildSummary(sortedTransactions),
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