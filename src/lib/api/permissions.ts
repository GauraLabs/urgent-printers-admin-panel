import type { Permission, Role } from '@/types';
import { get } from './client';

export interface PermissionGroup {
  key: string;
  label: string;
}

export interface PermissionDefinition {
  key: Permission;
  label: string;
  group: string;
}

export interface RoleDefinition {
  key: Role;
  label: string;
  permissions: Permission[];
}

export interface RoleCatalogue {
  groups: PermissionGroup[];
  permissions: PermissionDefinition[];
  roles: RoleDefinition[];
}

export async function getRoleCatalogue(): Promise<RoleCatalogue> {
  return get<RoleCatalogue>('/admin/permissions');
}
