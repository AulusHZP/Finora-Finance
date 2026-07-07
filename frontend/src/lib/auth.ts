import { API_BASE_URL } from "@/config/api";
import { authorizedJson, clearApiCache } from "@/services/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  creditCardClosingDay?: number | null;
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
  refreshToken?: string;
};

const TOKEN_KEY = "finora_token";
const REFRESH_TOKEN_KEY = "finora_refresh_token";
const USER_KEY = "finora_user";

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.message || "Request failed");
  }

  return body;
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

export const meRequest = async (): Promise<AuthUser> => {
  const body = await authorizedJson<ApiResponse<{ user: AuthUser }>>(`/auth/me`, { method: "GET" });

  if (!body.data?.user) {
    throw new Error("Invalid response from server");
  }

  return body.data.user;
};

export const updateProfileRequest = async (payload: {
  name?: string;
  email?: string;
  creditCardClosingDay?: number | null;
}): Promise<AuthUser> => {
  const body = await authorizedJson<ApiResponse<{ user: AuthUser }>>(`/auth/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!body.data?.user) {
    throw new Error("Invalid response from server");
  }

  return body.data.user;
};

export const logoutRequest = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  // Revokes the refresh token server-side; the access token stays stateless.
  await authorizedJson(`/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refreshToken ? { refreshToken } : {})
  });
};

export const storeAuthSession = (payload: AuthPayload) => {
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  }
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
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearApiCache();
};
