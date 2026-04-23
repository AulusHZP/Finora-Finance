import { API_BASE_URL } from "@/config/api";

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  isFixed?: boolean;
  date: string;
  method: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  title: string;
  amount: number;
  type: "income" | "expense";
  isFixed?: boolean;
  category: string;
  method: string;
  date: string;
  installmentCount?: number;
}

export type ImportTransactionPayload = CreateTransactionPayload;

export interface DashboardSummary {
  incomeTotal: number;
  expenseTotal: number;
  availableBalance: number;
  fixedCostsTotal: number;
  expenseOfIncomeRatio: number;
  fixedCostsRatio: number;
}

export interface DashboardData {
  transactions: Transaction[];
  goals: Goal[];
  summary: DashboardSummary;
  generatedAt: string;
}

const TOKEN_KEY = "finora_token";
const TRANSACTIONS_UPDATED_EVENT = "transactions-updated";
const DEFAULT_CACHE_TTL_MS = 30_000;

type CacheEntry<T> = {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
};

const apiCache = new Map<string, CacheEntry<unknown>>();

const notifyTransactionsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRANSACTIONS_UPDATED_EVENT));
  }
};

const invalidateCache = (prefix: string) => {
  for (const key of apiCache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}:`)) {
      apiCache.delete(key);
    }
  }
};

const getAuthToken = (): string | null => {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
};

const buildCacheKey = (resource: string, token: string) => `${resource}:${token}`;

const getCachedOrFetch = async <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_CACHE_TTL_MS
): Promise<T> => {
  const now = Date.now();
  const cached = apiCache.get(cacheKey) as CacheEntry<T> | undefined;

  if (cached?.value !== undefined && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = fetcher()
    .then((value) => {
      apiCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        value
      });

      return value;
    })
    .catch((error) => {
      apiCache.delete(cacheKey);
      throw error;
    });

  apiCache.set(cacheKey, {
    expiresAt: now + ttlMs,
    promise
  });

  return promise;
};

const requestJson = async <T>(url: string, init: RequestInit, token: string): Promise<T> => {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    ...init,
    headers
  });

  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(responseData?.message || `Request failed with status ${response.status}`);
  }

  return responseData as T;
};

const serializeTransactionPayload = (payload: CreateTransactionPayload) => ({
  ...payload,
  date: new Date(payload.date).toISOString()
});

const serializeGoalPayload = (payload: CreateGoalPayload) => ({
  ...payload,
  targetDate: payload.targetDate ? new Date(payload.targetDate).toISOString() : undefined
});

const invalidateDashboardData = () => {
  invalidateCache("dashboard");
  invalidateCache("transactions");
  invalidateCache("goals");
};

export const transactionAPI = {
  async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: Transaction }>(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(serializeTransactionPayload(payload))
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
  },

  async getTransactions(): Promise<Transaction[]> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const cacheKey = buildCacheKey("transactions:list", token);

    return getCachedOrFetch(cacheKey, async () => {
      const data = await requestJson<{ data: { transactions: Transaction[] } }>(`${API_BASE_URL}/transactions`, {
        method: "GET"
      }, token);

      return data.data.transactions;
    });
  },

  async updateTransaction(id: string, payload: Partial<CreateTransactionPayload>): Promise<Transaction> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const responseData = await requestJson<{ data: Transaction }>(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    await requestJson(`${API_BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: {
      }
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
  },

  async importTransactions(transactions: ImportTransactionPayload[]): Promise<{ imported: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: { imported: number } }>(`${API_BASE_URL}/transactions/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ transactions })
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
  },

  async clearImportedTransactions(): Promise<{ deleted: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: { deleted: number } }>(`${API_BASE_URL}/transactions/import-csv`, {
      method: "DELETE",
      headers: {
      }
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
  }
};

export interface Goal {
  id: string;
  userId: string;
  title: string;
  current: number;
  target: number;
  emoji: string;
  targetDate?: string;
  priority?: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  title: string;
  current: number;
  target: number;
  emoji: string;
  targetDate?: string;
  priority?: "low" | "medium" | "high";
}

export const goalAPI = {
  async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: Goal }>(`${API_BASE_URL}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(serializeGoalPayload(payload))
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
  },

  async getGoals(): Promise<Goal[]> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const cacheKey = buildCacheKey("goals:list", token);

    return getCachedOrFetch(cacheKey, async () => {
      const data = await requestJson<{ data: { goals: Goal[] } }>(`${API_BASE_URL}/goals`, {
        method: "GET"
      }, token);

      return data.data.goals;
    });
  },

  async updateGoal(id: string, payload: Partial<CreateGoalPayload>): Promise<Goal> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: Goal }>(`${API_BASE_URL}/goals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
  },

  async deleteGoal(id: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    await requestJson(`${API_BASE_URL}/goals/${id}`, {
      method: "DELETE",
      headers: {
      }
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
  }
};

export const dashboardAPI = {
  async getDashboard(forceRefresh = false): Promise<DashboardData> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const cacheKey = buildCacheKey("dashboard", token);

    if (forceRefresh) {
      apiCache.delete(cacheKey);
    }

    return getCachedOrFetch(cacheKey, async () => {
      const data = await requestJson<{ data: { dashboard: DashboardData } }>(`${API_BASE_URL}/dashboard`, {
        method: "GET"
      }, token);

      return data.data.dashboard;
    }, 15_000);
  }
};
