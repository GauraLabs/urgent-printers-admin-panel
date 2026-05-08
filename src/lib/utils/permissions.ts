import type { Role, Permission, AdminUser } from '@/types';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund',
    'printing_queue.view', 'printing_queue.manage',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.view', 'categories.manage',
    'customers.view', 'customers.edit', 'customers.ban',
    'payments.view', 'payments.refund',
    'coupons.view', 'coupons.manage',
    'content.view', 'content.manage',
    'reviews.view', 'reviews.moderate',
    'shipping.view', 'shipping.manage',
    'communications.view', 'communications.send',
    'reports.sales', 'reports.orders', 'reports.customers', 'reports.operations',
    'staff.view', 'staff.manage',
    'settings.view', 'settings.manage',
    'system.view',
  ],
  operations_manager: [
    'orders.view', 'orders.edit', 'orders.cancel',
    'printing_queue.view', 'printing_queue.manage',
    'products.view',
    'categories.view',
    'customers.view',
    'payments.view',
    'shipping.view', 'shipping.manage',
    'reports.orders', 'reports.operations',
  ],
  customer_support: [
    'orders.view', 'orders.edit',
    'customers.view', 'customers.edit',
    'communications.view', 'communications.send',
    'reviews.view', 'reviews.moderate',
    'reports.customers',
  ],
  catalogue_manager: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.view', 'categories.manage',
  ],
  finance: [
    'payments.view', 'payments.refund',
    'orders.view',
    'coupons.view',
    'reports.sales', 'reports.orders', 'reports.customers', 'reports.operations',
  ],
  marketing: [
    'coupons.view', 'coupons.manage',
    'content.view', 'content.manage',
    'communications.view', 'communications.send',
    'reports.customers',
    'reports.sales',
  ],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Compute a user's effective permissions:
 *   role_defaults + granted_permissions − revoked_permissions
 *
 * If the backend already pre-computed user.permissions (non-empty),
 * that value is trusted as the source of truth.
 * The local computation is used during development with mock data.
 */
export function getEffectivePermissions(user: AdminUser): Permission[] {
  // Backend pre-computed — trust it
  if (user.permissions.length > 0) return user.permissions;

  const base = new Set(getPermissionsForRole(user.role));
  for (const p of (user.granted_permissions ?? [])) base.add(p);
  for (const p of (user.revoked_permissions ?? [])) base.delete(p);
  return [...base];
}

/**
 * PERMISSION_GROUPS and PERMISSION_LABELS have been removed.
 * They are now fetched from the backend via GET /admin/permissions
 * and consumed by useRoleCatalogue() → RolePermissionsMatrix + PermissionEditor.
 *
 * ROLE_PERMISSIONS below is kept only as a local fallback for mock data
 * in development when backend is not running. It is NOT used for actual
 * permission checks — those always use user.permissions (pre-computed by backend).
 */
