'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getRoleCatalogue } from '@/lib/api/permissions';
import type { Permission, Role } from '@/types';
import type { RoleCatalogue, PermissionDefinition, RoleDefinition, PermissionGroup } from '@/lib/api/permissions';

/**
 * Fetches the role/permission catalogue from the backend once per session.
 * staleTime: Infinity — this data only changes on backend deploy, never mid-session.
 *
 * Contains:
 *   groups      — ordered permission groups (for matrix rows / editor sections)
 *   permissions — full list with labels and group membership
 *   roles       — each role's default permission set with display labels
 */
export function useRoleCatalogue() {
  return useQuery({
    queryKey: ['role-catalogue'],
    queryFn: getRoleCatalogue,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Convenience hook: returns a fast Set lookup of which permissions a given
 * role has by default, derived from the catalogue.
 * Returns null while the catalogue is loading.
 */
export function useRolePermissions(role: Role): Set<Permission> | null {
  const { data } = useRoleCatalogue();
  return useMemo(() => {
    if (!data) return null;
    const def = data.roles.find((r) => r.key === role);
    return new Set(def?.permissions ?? []);
  }, [data, role]);
}

export type { RoleCatalogue, PermissionDefinition, RoleDefinition, PermissionGroup };
