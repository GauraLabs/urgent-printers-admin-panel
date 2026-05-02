import type { LoginRequest, LoginResponse, AdminUser } from '@/types';
import { post } from './client';

function delay(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

const MOCK_USERS: Record<string, { password: string; user: AdminUser }> = {
  'admin@urgentprinters.com': {
    password: 'Admin@1234',
    user: {
      id: 'admin-1',
      email: 'admin@urgentprinters.com',
      name: 'Raj Kumar',
      role: 'super_admin',
      permissions: [],
      avatar: null,
      last_login: new Date().toISOString(),
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
    },
  },
  'ops@urgentprinters.com': {
    password: 'Ops@1234',
    user: {
      id: 'admin-2',
      email: 'ops@urgentprinters.com',
      name: 'Sunita Verma',
      role: 'operations_manager',
      permissions: [],
      avatar: null,
      last_login: new Date().toISOString(),
      is_active: true,
      created_at: '2025-02-15T00:00:00Z',
    },
  },
  'support@urgentprinters.com': {
    password: 'Support@1234',
    user: {
      id: 'admin-3',
      email: 'support@urgentprinters.com',
      name: 'Kiran Patel',
      role: 'customer_support',
      permissions: [],
      avatar: null,
      last_login: new Date().toISOString(),
      is_active: true,
      created_at: '2025-03-01T00:00:00Z',
    },
  },
  'finance@urgentprinters.com': {
    password: 'Finance@1234',
    user: {
      id: 'admin-5',
      email: 'finance@urgentprinters.com',
      name: 'Deepa Nair',
      role: 'finance',
      permissions: [],
      avatar: null,
      last_login: new Date().toISOString(),
      is_active: true,
      created_at: '2025-04-01T00:00:00Z',
    },
  },
};

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  await delay();

  // Switch to real API call when backend is ready:
  // return post<LoginResponse>('/auth/login', data);

  const record = MOCK_USERS[data.email.toLowerCase()];
  if (!record || record.password !== data.password) {
    throw { message: 'Invalid email or password', status: 401 };
  }

  return {
    access_token: `mock_jwt_${record.user.id}_${Date.now()}`,
    token_type: 'bearer',
    user: record.user,
  };
}

export async function logoutUser(): Promise<void> {
  // Switch to real API call when backend is ready:
  // await post('/auth/logout');
  await delay(200);
}

export async function getCurrentUser(): Promise<AdminUser> {
  // Switch to real API call when backend is ready:
  // return get<AdminUser>('/auth/me');
  await delay(300);
  return MOCK_USERS['admin@urgentprinters.com'].user;
}
