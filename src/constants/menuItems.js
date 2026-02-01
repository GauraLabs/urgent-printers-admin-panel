/**
 * Sidebar menu configuration
 * Includes icons, routes, and permission requirements
 */

import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Factory,
  BarChart3,
  Ticket,
  FileText,
  Settings,
  Shield,
  FolderTree,
  CreditCard,
  Mail,
  Server,
  MailPlus,
  Tag,
  Percent,
  Sliders,
} from 'lucide-react';
import { ROUTES } from './routes';
import { PERMISSIONS } from './permissions';

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: ROUTES.DASHBOARD,
    permissions: [], // Everyone can see dashboard
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    permissions: [PERMISSIONS.USER_READ],
    children: [
      {
        id: 'users-list',
        label: 'All Users',
        path: ROUTES.USERS,
        permissions: [PERMISSIONS.USER_READ],
      },
      {
        id: 'invitations',
        label: 'Staff Invitations',
        path: ROUTES.INVITATIONS,
        icon: MailPlus,
        permissions: [PERMISSIONS.USER_CREATE],
      },
      {
        id: 'roles',
        label: 'Roles & Permissions',
        path: ROUTES.ROLES,
        permissions: [PERMISSIONS.ROLE_READ],
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: ROUTES.PERMISSIONS,
        icon: Shield,
        permissions: [PERMISSIONS.PERMISSION_READ],
      },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    permissions: [PERMISSIONS.PRODUCT_READ],
    children: [
      {
        id: 'products-list',
        label: 'All Products',
        path: ROUTES.PRODUCTS,
        permissions: [PERMISSIONS.PRODUCT_READ],
      },
      {
        id: 'categories',
        label: 'Categories',
        path: ROUTES.CATEGORIES,
        icon: FolderTree,
        permissions: [PERMISSIONS.CATEGORY_READ],
      },
      {
        id: 'tags',
        label: 'Tags',
        path: ROUTES.TAGS,
        icon: Tag,
        permissions: [PERMISSIONS.TAG_READ],
      },
      {
        id: 'specifications',
        label: 'Specifications',
        path: ROUTES.SPECIFICATIONS,
        icon: Sliders,
        permissions: [PERMISSIONS.SPECIFICATION_READ],
      },
      {
        id: 'pricing-rules',
        label: 'Pricing Rules',
        path: ROUTES.PRICING_RULES,
        icon: Percent,
        permissions: [PERMISSIONS.PRICING_RULE_READ],
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    path: ROUTES.ORDERS,
    permissions: [PERMISSIONS.ORDER_READ],
  },
  {
    id: 'production',
    label: 'Production',
    icon: Factory,
    permissions: [PERMISSIONS.PRODUCTION_READ],
    children: [
      {
        id: 'production-dashboard',
        label: 'Dashboard',
        path: ROUTES.PRODUCTION,
        permissions: [PERMISSIONS.PRODUCTION_READ],
      },
      {
        id: 'production-batches',
        label: 'Batches',
        path: ROUTES.PRODUCTION_BATCHES,
        permissions: [PERMISSIONS.PRODUCTION_READ],
      },
    ],
  },
  {
    id: 'coupons',
    label: 'Coupons',
    icon: Ticket,
    path: ROUTES.COUPONS,
    permissions: [PERMISSIONS.COUPON_READ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    permissions: [PERMISSIONS.ANALYTICS_READ],
    children: [
      {
        id: 'analytics-dashboard',
        label: 'Dashboard',
        path: ROUTES.ANALYTICS,
        permissions: [PERMISSIONS.ANALYTICS_READ],
      },
      {
        id: 'reports',
        label: 'Reports',
        path: ROUTES.REPORTS,
        permissions: [PERMISSIONS.REPORTS_EXPORT],
      },
    ],
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: FileText,
    path: ROUTES.AUDIT_LOGS,
    permissions: [PERMISSIONS.AUDIT_READ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS_READ],
    children: [
      {
        id: 'general-settings',
        label: 'General',
        path: ROUTES.SETTINGS,
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
      {
        id: 'payment-settings',
        label: 'Payments',
        path: ROUTES.PAYMENT_SETTINGS,
        icon: CreditCard,
        permissions: [PERMISSIONS.SYSTEM_CONFIG],
      },
      {
        id: 'email-settings',
        label: 'Email',
        path: ROUTES.EMAIL_SETTINGS,
        icon: Mail,
        permissions: [PERMISSIONS.SYSTEM_CONFIG],
      },
      {
        id: 'system-settings',
        label: 'System',
        path: ROUTES.SYSTEM_SETTINGS,
        icon: Server,
        permissions: [PERMISSIONS.SYSTEM_CONFIG],
      },
    ],
  },
];

// Quick access items for dashboard
export const QUICK_ACCESS_ITEMS = [
  { label: 'New Order', path: ROUTES.ORDERS, icon: ShoppingCart },
  { label: 'Add Product', path: ROUTES.PRODUCT_CREATE, icon: Package },
  { label: 'Create Coupon', path: ROUTES.COUPON_CREATE, icon: Ticket },
  { label: 'View Reports', path: ROUTES.REPORTS, icon: BarChart3 },
];
