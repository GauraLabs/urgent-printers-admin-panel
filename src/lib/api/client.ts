import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: unwrap { data, message } envelope ──────────────────
// Backend wraps ALL successful responses as { data: <payload>, message: "..." }.
// We unwrap once here so all api functions just receive the payload.
function isWrapped(d: unknown): d is { data: unknown; message: unknown } {
  return typeof d === 'object' && d !== null && 'data' in d && 'message' in d;
}

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => {
    if (isWrapped(res.data)) {
      const payload = res.data.data;
      const meta = (res.data as Record<string, unknown>).meta;
      // paginated() returns { data: [...items], message, meta: {...} }.
      // Fold meta into the payload so callers receive { items, page, page_size, total, total_pages }.
      if (Array.isArray(payload) && meta && typeof meta === 'object') {
        res.data = { items: payload, ...meta };
      } else {
        res.data = payload;
      }
    }
    return res;
  },
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Don't try to refresh for the auth endpoints themselves —
    // a 401 on /login means wrong credentials, a 401 on /refresh means the
    // session is gone. Both should bubble straight to the caller.
    const url = original.url ?? '';
    const isAuthEndpoint =
      url.includes('/admin/auth/login') ||
      url.includes('/admin/auth/refresh') ||
      url.includes('/admin/auth/logout');

    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      throw toApiError(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (original.headers) original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Refresh response is also wrapped: { data: { access_token, ... }, message }
      const res = await axios.post<{ data: { access_token: string }; message: string }>(
        `${BASE_URL}/admin/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = res.data.data.access_token;
      useAuthStore.getState().setToken(newToken);
      processQueue(null, newToken);
      if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw toApiError(refreshError as AxiosError);
    } finally {
      isRefreshing = false;
    }
  }
);

function toApiError(error: AxiosError): ApiError {
  // Backend may return either { detail: "..." } (FastAPI default) or
  // { status, error, message: "..." } (custom envelope). Try both.
  const data = error.response?.data as
    | { detail?: string; message?: string; error?: string }
    | undefined;
  return {
    message:
      data?.detail ??
      data?.message ??
      error.message ??
      'An unexpected error occurred',
    status: error.response?.status ?? 0,
  };
}

// ── Typed helpers ────────────────────────────────────────────────────────────
// These return the unwrapped data because the response interceptor strips the envelope.
export async function get<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await apiClient.get<T>(path, { params, signal });
  return res.data;
}

export async function post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await apiClient.post<T>(path, body, { signal });
  return res.data;
}

export async function put<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await apiClient.put<T>(path, body, { signal });
  return res.data;
}

export async function patch<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await apiClient.patch<T>(path, body, { signal });
  return res.data;
}

export async function del<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await apiClient.delete<T>(path, { signal });
  return res.data;
}
