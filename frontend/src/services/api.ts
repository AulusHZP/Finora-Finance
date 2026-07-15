import { API_BASE_URL } from "@/config/api";

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  emoji: string;
  subcategories: { id: string; name: string; emoji: string }[];
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  categoryId?: string;
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
  categoryId?: string;
  method: string;
  date: string;
  installmentCount?: number;
}

export type ImportTransactionPayload = CreateTransactionPayload;

export interface CreditCardSummary {
  closingDay: number;
  currentInvoiceTotal: number;
  nextInvoiceTotal: number;
  currentClosesOn: string;
}

export interface DashboardSummary {
  incomeTotal: number;
  /** All expenses regardless of payment method (used for display in the Despesas card). */
  expenseTotal: number;
  /** Expenses that immediately deduct from the bank/digital-wallet balance (Pix, Débito, Transferência). */
  balanceExpenseTotal: number;
  availableBalance: number;
  goalsReserved: number;
  fixedCostsTotal: number;
  expenseOfIncomeRatio: number;
  fixedCostsRatio: number;
  carryoverBalance: number;
  balanceOffset: number;
  creditCard: CreditCardSummary | null;
}

export interface BudgetStatus {
  id: string;
  categoryId: string;
  categoryName: string;
  emoji: string;
  monthlyLimit: number;
  spent: number;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  isFixed: boolean;
  category: string;
  method: string;
  dayOfMonth: number;
  nextRunDate: string;
  endDate?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringPayload {
  title: string;
  amount: number;
  type: "income" | "expense";
  isFixed?: boolean;
  category: string;
  method: string;
  date: string;
}

export interface DashboardData {
  transactions: Transaction[];
  goals: Goal[];
  budgets: BudgetStatus[];
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

export const clearApiCache = () => {
  apiCache.clear();
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

const REQUEST_TIMEOUT_MS = 15_000;
const REFRESH_TOKEN_KEY = "finora_refresh_token";

const clearSessionAndRedirect = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("finora_user");
  apiCache.clear();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
    window.location.assign("/auth");
  }
};

let refreshInFlight: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
const tryRefreshSession = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) return null;

        const body = (await response.json()) as { data?: { token?: string; refreshToken?: string } };
        if (!body.data?.token) return null;

        localStorage.setItem(TOKEN_KEY, body.data.token);
        if (body.data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, body.data.refreshToken);
        }

        return body.data.token;
      } catch {
        return null;
      }
    })();
    refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

const fetchJson = async (url: string, init: RequestInit, token: string) => {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("A requisição demorou demais. Verifique sua conexão e tente novamente.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : null;
  return { response, responseData };
};

const requestJson = async <T>(url: string, init: RequestInit, token: string): Promise<T> => {
  let { response, responseData } = await fetchJson(url, init, token);

  // Expired access token: refresh once and retry the original request.
  if (response.status === 401) {
    const refreshedToken = await tryRefreshSession();
    if (refreshedToken) {
      ({ response, responseData } = await fetchJson(url, init, refreshedToken));
    }
  }

  if (response.status === 401) {
    clearSessionAndRedirect();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    throw new Error(responseData?.message || `Request failed with status ${response.status}`);
  }

  return responseData as T;
};

/** Authenticated JSON request against the API — shared with lib/auth. */
export const authorizedJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  if (!token) throw new Error("Não autenticado");
  return requestJson<T>(`${API_BASE_URL}${path}`, init, token);
};

const serializeTransactionPayload = (payload: CreateTransactionPayload) => ({
  ...payload,
  // Append noon UTC time so the date never shifts to a different calendar day
  // due to timezone offsets (e.g. UTC-3 would make "2026-05-01" appear as Apr 30)
  date: new Date(`${payload.date}T12:00:00Z`).toISOString()
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

export const categorizeAPI = {
  async getCategories(): Promise<Category[]> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const res = await fetch(`${API_BASE_URL}/transactions/categories`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data;
  }
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

    const serializedPayload = {
      ...payload,
      ...(payload.date ? { date: new Date(`${payload.date}T12:00:00Z`).toISOString() } : {})
    };

    const responseData = await requestJson<{ data: Transaction }>(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(serializedPayload)
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

  async contribute(id: string, amount: number): Promise<Goal> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: Goal }>(`${API_BASE_URL}/goals/${id}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data;
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

export const budgetAPI = {
  async upsert(categoryId: string, monthlyLimit: number): Promise<void> {
    await authorizedJson(`/budgets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, monthlyLimit })
    });

    invalidateCache("dashboard");
    notifyTransactionsUpdated();
  },

  async remove(id: string): Promise<void> {
    await authorizedJson(`/budgets/${id}`, { method: "DELETE" });

    invalidateCache("dashboard");
    notifyTransactionsUpdated();
  }
};

export const recurringAPI = {
  async list(): Promise<RecurringTransaction[]> {
    const data = await authorizedJson<{ data: { recurring: RecurringTransaction[] } }>(`/recurring`, {
      method: "GET"
    });
    return data.data.recurring;
  },

  async create(payload: CreateRecurringPayload): Promise<RecurringTransaction> {
    const data = await authorizedJson<{ data: { recurring: RecurringTransaction } }>(`/recurring`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        // Noon UTC keeps the calendar day stable across timezones
        date: new Date(`${payload.date}T12:00:00Z`).toISOString()
      })
    });

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return data.data.recurring;
  },

  async setActive(id: string, active: boolean): Promise<RecurringTransaction> {
    const data = await authorizedJson<{ data: RecurringTransaction }>(`/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await authorizedJson(`/recurring/${id}`, { method: "DELETE" });

    invalidateDashboardData();
    notifyTransactionsUpdated();
  }
};

export const balanceAPI = {
  async updateBalanceOffset(offset: number): Promise<number> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const responseData = await requestJson<{ data: { balanceOffset: number } }>(`${API_BASE_URL}/auth/balance-offset`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ offset })
    }, token);

    invalidateDashboardData();
    notifyTransactionsUpdated();
    return responseData.data.balanceOffset;
  }
};
