'use client';

import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/utils/permissions';
import type { Permission } from '@/types';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  function can(permission: Permission): boolean {
    if (!role) return false;
    return hasPermission(role, permission);
  }

  return {
    role,
    can,
    // convenience flags
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
