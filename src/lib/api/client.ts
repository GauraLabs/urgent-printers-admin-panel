import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiError } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
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
      const res = await axios.post<{ access_token: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = res.data.access_token;
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
  return {
    message:
      (error.response?.data as { detail?: string })?.detail ??
      error.message ??
      'An unexpected error occurred',
    status: error.response?.status ?? 0,
  };
}

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
