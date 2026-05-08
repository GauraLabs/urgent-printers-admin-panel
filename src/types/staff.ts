import type { Role, Permission, AdminUser, ActivityLog } from './auth';

export type { Role, Permission, AdminUser, ActivityLog };

export interface PaginatedListResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export type StaffListResponse = PaginatedListResponse<AdminUser>;
export type ActivityLogListResponse = PaginatedListResponse<ActivityLog>;

export interface CreateStaffRequest {
  email: string;
  name: string;
  role: Role;
  password: string;
  granted_permissions?: Permission[];
  revoked_permissions?: Permission[];
}

export interface UpdateStaffRequest {
  name?: string;
  role?: Role;
  is_active?: boolean;
  granted_permissions?: Permission[];
  revoked_permissions?: Permission[];
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
