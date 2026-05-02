import type { Role, Permission } from '@/types';

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
