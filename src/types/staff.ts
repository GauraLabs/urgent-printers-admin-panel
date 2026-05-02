import type { Role, Permission, AdminUser, ActivityLog } from './auth';

export type { Role, Permission, AdminUser, ActivityLog };

export interface StaffListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ActivityLogListResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateStaffRequest {
  email: string;
  name: string;
  role: Role;
  password: string;
  permissions?: Permission[];
}

export interface UpdateStaffRequest {
  name?: string;
  role?: Role;
  is_active?: boolean;
  permissions?: Permission[];
}

export interface RolePermissionMatrix {
  role: Role;
  label: string;
  permissions: Permission[];
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  operations_manager: 'Operations Manager',
  customer_support: 'Customer Support',
  catalogue_manager: 'Catalogue Manager',
  finance: 'Finance',
  marketing: 'Marketing',
};
