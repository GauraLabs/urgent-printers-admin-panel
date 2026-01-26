/**
 * Application route constants
 * Centralized route definitions for consistent navigation
 */

export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCEPT_INVITATION: '/accept-invitation',

  // Dashboard
  DASHBOARD: '/',

  // User Management
  USERS: '/users',
  USER_DETAIL: '/users/:id',
  ROLES: '/users/roles',
  INVITATIONS: '/invitations',

  // Product Management
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_CREATE: '/products/create',
  CATEGORIES: '/products/categories',

  // Order Management
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',

  // Production
  PRODUCTION: '/production',
  PRODUCTION_BATCHES: '/production/batches',

  // Analytics
  ANALYTICS: '/analytics',
  REPORTS: '/analytics/reports',

  // Coupons
  COUPONS: '/coupons',
  COUPON_CREATE: '/coupons/create',

  // Audit Logs
  AUDIT_LOGS: '/audit-logs',

  // Settings
  SETTINGS: '/settings',
  PAYMENT_SETTINGS: '/settings/payments',
  EMAIL_SETTINGS: '/settings/email',
  SYSTEM_SETTINGS: '/settings/system',
};

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.ACCEPT_INVITATION,
];
