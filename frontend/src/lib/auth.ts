import { API_BASE_URL } from "@/config/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type AuthPayload = {
  user: AuthUser;
  token: string;
};

const TOKEN_KEY = "finora_token";
const USER_KEY = "finora_user";

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.message || "Request failed");
  }

  return body;
};

const authHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerRequest = async (payload: { name: string; email: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await parseResponse<AuthPayload>(response);
  if (!body.data) {
    throw new Error("Invalid response from server");
  }

  return body.data;
};

export const loginRequest = async (payload: { email: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await parseResponse<AuthPayload>(response);
  if (!body.data) {
    throw new Error("Invalid response from server");
  }

  return body.data;
};

export const meRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    }
  });

  const body = await parseResponse<{ user: AuthUser }>(response);
  if (!body.data?.user) {
    throw new Error("Invalid response from server");
  }

  return body.data.user;
};

export const updateProfileRequest = async (payload: { name?: string; email?: string }) => {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(payload)
  });

  const body = await parseResponse<{ user: AuthUser }>(response);
  if (!body.data?.user) {
    throw new Error("Invalid response from server");
  }

  return body.data.user;
};

export const logoutRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    }
  });

  await parseResponse(response);
};

export const storeAuthSession = (payload: AuthPayload) => {
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
};

export const setStoredUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
