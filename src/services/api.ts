const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:4000";

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
}

export interface ImportTransactionPayload extends CreateTransactionPayload {}

const TOKEN_KEY = "finora_token";
const TRANSACTIONS_UPDATED_EVENT = "transactions-updated";

const notifyTransactionsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRANSACTIONS_UPDATED_EVENT));
  }
};

const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const transactionAPI = {
  async createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const body = JSON.stringify({
      ...payload,
      date: new Date(payload.date).toISOString()
    });

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Transaction creation error:", responseData);
      throw new Error(responseData.message || "Falha ao criar transação");
    }

    notifyTransactionsUpdated();
    return responseData.data;
  },

  async getTransactions(): Promise<Transaction[]> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();
    return data.data.transactions;
  },

  async updateTransaction(id: string, payload: Partial<CreateTransactionPayload>): Promise<Transaction> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to update transaction");
    }

    const data = await response.json();
    notifyTransactionsUpdated();
    return data.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to delete transaction");
    }

    notifyTransactionsUpdated();
  },

  async importTransactions(transactions: ImportTransactionPayload[]): Promise<{ imported: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const response = await fetch(`${API_BASE_URL}/transactions/import-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ transactions })
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Falha ao importar CSV");
    }

    notifyTransactionsUpdated();
    return responseData.data;
  },

  async clearImportedTransactions(): Promise<{ deleted: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const response = await fetch(`${API_BASE_URL}/transactions/import-csv`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Falha ao limpar transações importadas");
    }

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

    const body = JSON.stringify({
      ...payload,
      targetDate: payload.targetDate ? new Date(payload.targetDate).toISOString() : undefined
    });

    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Goal creation error:", responseData);
      throw new Error(responseData.message || "Falha ao criar objetivo");
    }

    return responseData.data;
  },

  async getGoals(): Promise<Goal[]> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error("Falha ao buscar objetivos");
    }

    const data = await response.json();
    return data.data.goals;
  },

  async updateGoal(id: string, payload: Partial<CreateGoalPayload>): Promise<Goal> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Falha ao atualizar objetivo");
    }

    const data = await response.json();
    return data.data;
  },

  async deleteGoal(id: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error("Não autenticado");

    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Falha ao deletar objetivo");
    }
  }
};
