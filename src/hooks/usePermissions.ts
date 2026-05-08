'use client';

import { useAuthStore } from '@/store/authStore';
import { getEffectivePermissions } from '@/lib/utils/permissions';
import type { Permission } from '@/types';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  // Use pre-computed effective permissions (role + grants - revokes)
  const effectivePerms = user ? new Set(getEffectivePermissions(user)) : new Set<Permission>();

  function can(permission: Permission): boolean {
    if (!user) return false;
    // Super admin always has everything
    if (user.role === 'super_admin') return true;
    return effectivePerms.has(permission);
  }

  return {
    role,
    can,
    effectivePermissions: [...effectivePerms],
    canViewOrders: can('orders.view'),
    canEditOrders: can('orders.edit'),
    canRefundOrders: can('orders.refund'),
    canManagePrintingQueue: can('printing_queue.manage'),
    canManageProducts: can('products.edit'),
    canManageCategories: can('categories.manage'),
    canViewCustomers: can('customers.view'),
    canBanCustomers: can('customers.ban'),
    canViewPayments: can('payments.view'),
    canIssueRefunds: can('payments.refund'),
    canManageCoupons: can('coupons.manage'),
    canManageContent: can('content.manage'),
    canModerateReviews: can('reviews.moderate'),
    canManageShipping: can('shipping.manage'),
    canSendCommunications: can('communications.send'),
    canViewSalesReports: can('reports.sales'),
    canManageStaff: can('staff.manage'),
    canManageSettings: can('settings.manage'),
    canViewSystem: can('system.view'),
    isSuperAdmin: role === 'super_admin',
  };
}
