import type { Role, Permission, AdminUser } from '@/types';

// Mirrors app/core/permissions.py ROLE_PERMISSIONS (backend is the source of
// truth — see getEffectivePermissions below). Keep these two in sync manually;
// there is no shared codegen between the repos.
//
// NOTE (2026-08-01): operations_manager includes content.view/content.manage
// here, but the backend's ROLE_PERMISSIONS does NOT yet grant them — this is
// a known backend gap (Operations Manager can't see/manage Banners and other
// Content items despite being an otherwise broad operational role). Flagged
// to the backend team; once app/core/permissions.py is updated to match, this
// comment can be removed. Until then this local fallback is "ahead of" the
// backend, which only matters in dev/mock mode (see getEffectivePermissions).
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.manage_proofs',
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
    'system.view', 'system.manage',
  ],
  operations_manager: [
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.refund', 'orders.manage_proofs',
    'printing_queue.view', 'printing_queue.manage',
    'products.view', 'products.create', 'products.edit',
    'categories.view', 'categories.manage',
    'customers.view', 'customers.edit',
    'payments.view',
    'coupons.view', 'coupons.manage',
    'content.view', 'content.manage', // see NOTE above — pending backend fix
    'shipping.view', 'shipping.manage',
    'communications.view', 'communications.send',
    'reports.sales', 'reports.orders', 'reports.customers', 'reports.operations',
    'staff.view',
    'settings.view',
  ],
  customer_support: [
    'orders.view', 'orders.edit', 'orders.cancel', 'orders.manage_proofs',
    'printing_queue.view',
    'products.view',
    'categories.view',
    'customers.view', 'customers.edit',
    'payments.view',
    'coupons.view',
    'reviews.view',
    'shipping.view',
    'communications.view', 'communications.send',
    'reports.orders', 'reports.customers',
  ],
  catalogue_manager: [
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.view', 'categories.manage',
    'content.view', 'content.manage',
    'reviews.view', 'reviews.moderate',
    'orders.view',
  ],
  finance: [
    'orders.view',
    'payments.view', 'payments.refund',
    'coupons.view', 'coupons.manage',
    'reports.sales', 'reports.orders', 'reports.customers', 'reports.operations',
    'settings.view',
  ],
  marketing: [
    'products.view',
    'categories.view',
    'coupons.view', 'coupons.manage',
    'content.view', 'content.manage',
    'reviews.view',
    'communications.view', 'communications.send',
    'reports.sales', 'reports.customers',
  ],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Checks whether a logged-in user effectively has a permission — role
 * defaults plus per-user grants/revokes, with the backend's pre-computed
 * user.permissions trusted first (see getEffectivePermissions). Takes the
 * full AdminUser, not just a role string, so per-user overrides aren't lost.
 */
export function hasPermission(user: AdminUser, permission: Permission): boolean {
  if (user.role === 'super_admin') return true;
  return getEffectivePermissions(user).includes(permission);
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
