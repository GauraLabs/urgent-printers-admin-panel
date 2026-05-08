/**
 * Real backend auth — wired to the FastAPI admin auth endpoints.
 * The httponly refresh cookie is handled automatically by the browser
 * because the apiClient is configured with withCredentials: true.
 */

import type { LoginRequest, LoginResponse, AdminUser } from '@/types';
import { post, get } from './client';

/**
 * Backend returns user.id as a number — normalize to string so the rest of
 * the app (URL builders, route params, etc.) treats all IDs uniformly.
 */
function normalizeUser(raw: AdminUser & { id: string | number }): AdminUser {
  return { ...raw, id: String(raw.id) };
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const res = await post<{ access_token: string; token_type: string; user: AdminUser & { id: string | number } }>(
    '/admin/auth/login',
    data
  );
  return {
    access_token: res.access_token,
    token_type: res.token_type,
    user: normalizeUser(res.user),
  };
}

export async function logoutUser(): Promise<void> {
  await post<null>('/admin/auth/logout');
}

export async function getCurrentUser(): Promise<AdminUser> {
  const user = await get<AdminUser & { id: string | number }>('/admin/auth/me');
  return normalizeUser(user);
}

/**
 * Refresh the session using the httponly cookie. Returns the new user.
 * Used on app mount to restore sessions after page reload.
 * Throws if the refresh token is missing/expired — caller should logout.
 */
export async function refreshSession(): Promise<{ access_token: string; user: AdminUser }> {
  const res = await post<{ access_token: string; token_type: string; user: AdminUser & { id: string | number } }>(
    '/admin/auth/refresh'
  );
  return {
    access_token: res.access_token,
    user: normalizeUser(res.user),
  };
}
