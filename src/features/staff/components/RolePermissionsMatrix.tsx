import { CheckCircle2, XCircle } from 'lucide-react';
import { ALL_ROLES, ROLE_LABELS } from '@/lib/constants/roles';
import { getPermissionsForRole } from '@/lib/utils/permissions';
import type { Permission } from '@/types';

const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: 'Orders',
    permissions: ['orders.view', 'orders.edit', 'orders.cancel', 'orders.refund'],
  },
  {
    label: 'Printing',
    permissions: ['printing_queue.view', 'printing_queue.manage'],
  },
  {
    label: 'Products',
    permissions: ['products.view', 'products.create', 'products.edit', 'products.delete', 'categories.view', 'categories.manage'],
  },
  {
    label: 'Customers',
    permissions: ['customers.view', 'customers.edit', 'customers.ban'],
  },
  {
    label: 'Finance',
    permissions: ['payments.view', 'payments.refund', 'coupons.view', 'coupons.manage'],
  },
  {
    label: 'Content',
    permissions: ['content.view', 'content.manage', 'reviews.view', 'reviews.moderate'],
  },
  {
    label: 'Comms & Shipping',
    permissions: ['communications.view', 'communications.send', 'shipping.view', 'shipping.manage'],
  },
  {
    label: 'Reports',
    permissions: ['reports.sales', 'reports.orders', 'reports.customers', 'reports.operations'],
  },
  {
    label: 'System',
    permissions: ['staff.view', 'staff.manage', 'settings.view', 'settings.manage', 'system.view'],
  },
];

const PERMISSION_LABEL: Partial<Record<Permission, string>> = {
  'orders.view': 'View', 'orders.edit': 'Edit', 'orders.cancel': 'Cancel', 'orders.refund': 'Refund',
  'printing_queue.view': 'View', 'printing_queue.manage': 'Manage',
  'products.view': 'View', 'products.create': 'Create', 'products.edit': 'Edit', 'products.delete': 'Delete',
  'categories.view': 'View', 'categories.manage': 'Manage',
  'customers.view': 'View', 'customers.edit': 'Edit', 'customers.ban': 'Ban',
  'payments.view': 'View', 'payments.refund': 'Refund',
  'coupons.view': 'View', 'coupons.manage': 'Manage',
  'content.view': 'View', 'content.manage': 'Manage',
  'reviews.view': 'View', 'reviews.moderate': 'Moderate',
  'communications.view': 'View', 'communications.send': 'Send',
  'shipping.view': 'View', 'shipping.manage': 'Manage',
  'reports.sales': 'Sales', 'reports.orders': 'Orders', 'reports.customers': 'Customers', 'reports.operations': 'Operations',
  'staff.view': 'View', 'staff.manage': 'Manage',
  'settings.view': 'View', 'settings.manage': 'Manage', 'system.view': 'System',
};

export function RolePermissionsMatrix() {
  const rolePerms = Object.fromEntries(ALL_ROLES.map((r) => [r, new Set(getPermissionsForRole(r))]));

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-40 sticky left-0 bg-muted/50">Permission</th>
            {ALL_ROLES.map((r) => (
              <th key={r} className="px-3 py-3 text-center font-semibold text-foreground whitespace-nowrap">
                {ROLE_LABELS[r]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_GROUPS.map((group) => (
            <>
              <tr key={`group-${group.label}`} className="border-b border-border bg-muted/20">
                <td colSpan={ALL_ROLES.length + 1} className="px-4 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                </td>
              </tr>
              {group.permissions.map((perm) => (
                <tr key={perm} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground sticky left-0 bg-card font-medium">
                    {PERMISSION_LABEL[perm] ?? perm}
                  </td>
                  {ALL_ROLES.map((r) => (
                    <td key={r} className="px-3 py-2 text-center">
                      {rolePerms[r].has(perm)
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                        : <XCircle className="h-4 w-4 text-border mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
