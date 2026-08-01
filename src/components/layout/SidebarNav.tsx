'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingCart,
  Printer,
  Truck,
  Package,
  Tag,
  Users,
  Star,
  CreditCard,
  Ticket,
  BarChart2,
  Bell,
  FileText,
  Image,
  MessageCircle,
  Megaphone,
  HelpCircle,
  Link2,
  Palette,
  Users2,
  Activity,
  Settings,
  Server,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  /**
   * Any-of gate for items that front more than one permission-scoped page
   * (e.g. Reports: reports.sales/orders/customers/operations each unlock a
   * different sub-report). Visible if the user holds ANY of these — a single
   * `permission` would wrongly hide the whole item for a role that only has
   * some of the underlying permissions.
   */
  permissions?: Permission[];
  /** Paired with `permissions` — routes to whichever sub-page the user's
   * first-held permission (in array order) actually unlocks, instead of
   * always linking to `href` (which may 403 for that role). */
  hrefByPermission?: Partial<Record<Permission, string>>;
  matchPrefix?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'orders.view' },
      { label: 'Printing Queue', href: '/printing-queue', icon: Printer, permission: 'printing_queue.view' },
      { label: 'Shipping', href: '/shipping', icon: Truck, permission: 'shipping.view' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Products', href: '/products', icon: Package, permission: 'products.view' },
      { label: 'Categories', href: '/categories', icon: Tag, permission: 'categories.view' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Customers', href: '/customers', icon: Users, permission: 'customers.view' },
      { label: 'Reviews', href: '/reviews', icon: Star, permission: 'reviews.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', href: '/payments', icon: CreditCard, permission: 'payments.view' },
      { label: 'Coupons', href: '/coupons', icon: Ticket, permission: 'coupons.view' },
      {
        label: 'Reports', href: '/reports/sales', icon: BarChart2, matchPrefix: '/reports',
        permissions: ['reports.sales', 'reports.orders', 'reports.customers', 'reports.operations'],
        hrefByPermission: {
          'reports.sales': '/reports/sales',
          'reports.orders': '/reports/orders',
          'reports.customers': '/reports/customers',
          'reports.operations': '/reports/operations',
        },
      },
    ],
  },
  {
    label: 'Communications',
    items: [
      { label: 'Notifications', href: '/communications', icon: Bell, permission: 'communications.view' },
      { label: 'Templates', href: '/communications/templates', icon: FileText, permission: 'communications.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Banners', href: '/content/banners', icon: Image, permission: 'content.view' },
      { label: 'Testimonials', href: '/content/testimonials', icon: MessageCircle, permission: 'content.view' },
      { label: 'Announcements', href: '/content/announcements', icon: Megaphone, permission: 'content.view' },
      { label: 'FAQs', href: '/content/faqs', icon: HelpCircle, permission: 'content.view' },
      { label: 'Navigation', href: '/content/navigation', icon: Link2, permission: 'content.view' },
      { label: 'Theme', href: '/content/theme', icon: Palette, permission: 'content.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Staff', href: '/staff', icon: Users2, permission: 'staff.view' },
      { label: 'Notification Preferences', href: '/staff/notifications', icon: Bell, permission: 'staff.manage' },
      { label: 'Activity Log', href: '/staff/activity-log', icon: Activity, permission: 'system.view' },
      { label: 'Settings', href: '/settings/general', icon: Settings, permission: 'settings.view', matchPrefix: '/settings' },
      { label: 'System Health', href: '/system', icon: Server, permission: 'system.view' },
    ],
  },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { can, isSuperAdmin } = usePermissions();

  function isActive(item: NavItem): boolean {
    if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
    if (item.href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(item.href);
  }

  function isVisible(item: NavItem): boolean {
    if (isSuperAdmin) return true;
    if (item.permissions) return item.permissions.some(can);
    return !item.permission || can(item.permission);
  }

  function resolveHref(item: NavItem): string {
    if (item.permissions && item.hrefByPermission && !isSuperAdmin) {
      const granted = item.permissions.find(can);
      if (granted) return item.hrefByPermission[granted] ?? item.href;
    }
    return item.href;
  }

  return (
    <nav className="py-2 px-2 space-y-4">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(isVisible);
        if (!visibleItems.length) return null;

        return (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--sidebar-text)', opacity: 0.45 }}>
                {group.label}
              </p>
            )}
            <ul className="space-y-px">
              {visibleItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                const href = resolveHref(item);
                return (
                  <li key={item.href}>
                    <motion.div whileHover={{ x: collapsed ? 0 : 2 }} transition={{ duration: 0.12 }}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[12.5px] font-medium transition-colors duration-150',
                          collapsed && 'justify-center px-2'
                        )}
                        style={active ? {
                          backgroundColor: 'var(--sidebar-active-bg)',
                          color: 'var(--sidebar-active-text)',
                        } : {
                          color: 'var(--sidebar-text)',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                            e.currentTarget.style.color = 'var(--sidebar-text-active)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--sidebar-text)';
                          }
                        }}
                      >
                        {active && !collapsed && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                            style={{ backgroundColor: 'var(--sidebar-active-text)' }}
                          />
                        )}
                        <Icon className={cn('flex-shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-[15px] w-[15px]')} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
