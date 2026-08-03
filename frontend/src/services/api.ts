/**
 * api.ts — Finora API client (rebuilt for new schema)
 *
 * Types and functions aligned with the new backend:
 * - Transaction.date: YYYY-MM-DD string
 * - Transaction.description (not title), .categoryId (required), no method/isFixed
 * - category.isIncome replaces type='income'
 * - DashboardData new shape
 * - New: limitsAPI, goalContributionsAPI, categoriesAPI
 */

import { API_BASE_URL } from "@/config/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function clearApiCache() {}

export const authorizedJson = request;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("finora_token");
  const headers = new Headers(options?.headers || {});
  
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/auth/login') {
      // Clear invalid token
      localStorage.removeItem("finora_token");
      localStorage.removeItem("finora_user");
    }
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  isIncome: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  /** YYYY-MM-DD local date string */
  date: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    isIncome: boolean;
  };
}

export interface CreateTransactionPayload {
  categoryId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

// ─── Dashboard types ──────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalSpent: number;
  totalIncome: number;
  available: number | null;
  totalLimit: number | null;
}

export interface CategoryBudgetSummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number;
  limit: number | null;
  usagePct: number | null;
  status: "safe" | "warning" | "danger" | null;
  remaining: number | null;
}

export interface DonutDataItem {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
}

export interface LineDataPoint {
  day: number;
  cumulative: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  alertCategories: CategoryBudgetSummary[];
  categoryBudgets: CategoryBudgetSummary[];
  donutData: DonutDataItem[];
  lineData: LineDataPoint[];
  recentTransactions: {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: { id: string; name: string; icon: string; color: string; isIncome: boolean };
  }[];
}

// ─── Limits types ─────────────────────────────────────────────────────────────

export interface LimitsData {
  year: number;
  month: number;
  totalLimit: number | null;
  alertThreshold: number;
  totalSpent: number;
  totalUsagePct: number | null;
  totalStatus: "safe" | "warning" | "danger" | null;
  inWarningCount: number;
  overLimitCount: number;
  categories: CategoryBudgetSummary[];
}

// ─── Goals types ──────────────────────────────────────────────────────────────

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  icon: string;
  targetAmount: number;
  deadline: string | null;
  isCompleted: boolean;
  createdAt: string;
  contributions: GoalContribution[];
  currentAmount: number;
  progressPct: number;
  remaining: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const dashboardAPI = {
  get: (year: number, month: number) =>
    request<DashboardData>(`/dashboard?year=${year}&month=${month}`),
};

export const transactionAPI = {
  list: (params?: { year?: number; month?: number; categoryId?: string }) => {
    const q = new URLSearchParams();
    if (params?.year) q.set("year", String(params.year));
    if (params?.month) q.set("month", String(params.month));
    if (params?.categoryId) q.set("categoryId", params.categoryId);
    const qs = q.toString();
    return request<Transaction[]>(`/transactions${qs ? `?${qs}` : ""}`);
  },

  create: (payload: CreateTransactionPayload) =>
    request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateTransactionPayload) =>
    request<Transaction>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/transactions/${id}`, { method: "DELETE" }),
};

export const limitsAPI = {
  get: (year: number, month: number) =>
    request<LimitsData>(`/budgets?year=${year}&month=${month}`),

  updateBudget: (year: number, month: number, data: { totalLimit?: number | null; alertThreshold?: number }) =>
    request<unknown>(`/budgets?year=${year}&month=${month}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  upsertCategoryLimit: (year: number, month: number, categoryId: string, limitAmount: number | null) =>
    request<unknown>(`/budgets/categories/${categoryId}?year=${year}&month=${month}`, {
      method: "PUT",
      body: JSON.stringify({ limitAmount }),
    }),
};

export const goalAPI = {
  list: () => request<Goal[]>("/goals"),

  create: (payload: { name: string; icon: string; targetAmount: number; deadline?: string | null }) =>
    request<Goal>("/goals", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<{ name: string; icon: string; targetAmount: number; deadline: string | null }>) =>
    request<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/goals/${id}`, { method: "DELETE" }),

  addContribution: (goalId: string, payload: { amount: number; date: string; note?: string }) =>
    request<GoalContribution>(`/goals/${goalId}/contributions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteContribution: (contributionId: string) =>
    request<{ success: boolean }>(`/goals/contributions/${contributionId}`, { method: "DELETE" }),
};

export const categoryAPI = {
  list: () => request<Category[]>("/categories"),

  create: (payload: { name: string; icon: string; color: string }) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<{ name: string; icon: string; color: string }>) =>
    request<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  delete: (id: string) =>
    request<{ success: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};
