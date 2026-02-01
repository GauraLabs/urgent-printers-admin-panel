/**
 * Permission constants matching backend RBAC system
 * Used for conditional rendering and access control
 */

export const PERMISSIONS = {
  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Role Management
  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  // Product Management
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Category Management
  CATEGORY_READ: 'category:read',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',

  // Tag Management
  TAG_READ: 'tag:read',
  TAG_CREATE: 'tag:create',
  TAG_UPDATE: 'tag:update',
  TAG_DELETE: 'tag:delete',

  // Specification Management (Materials, Sizes, Finishes, Colors)
  SPECIFICATION_READ: 'specification:read',
  SPECIFICATION_CREATE: 'specification:create',
  SPECIFICATION_UPDATE: 'specification:update',
  SPECIFICATION_DELETE: 'specification:delete',

  // Pricing Rule Management
  PRICING_RULE_READ: 'pricing_rule:read',
  PRICING_RULE_CREATE: 'pricing_rule:create',
  PRICING_RULE_UPDATE: 'pricing_rule:update',
  PRICING_RULE_DELETE: 'pricing_rule:delete',

  // Order Management
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  ORDER_REFUND: 'order:refund',

  // Production Management
  PRODUCTION_READ: 'production:read',
  PRODUCTION_UPDATE: 'production:update',
  BATCH_CREATE: 'batch:create',

  // Coupon Management
  COUPON_READ: 'coupon:read',
  COUPON_CREATE: 'coupon:create',
  COUPON_UPDATE: 'coupon:update',
  COUPON_DELETE: 'coupon:delete',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  REPORTS_EXPORT: 'reports:export',

  // Audit Logs
  AUDIT_READ: 'audit:read',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  SYSTEM_CONFIG: 'system:config',

  // Permission Management
  PERMISSION_READ: 'system:manage_roles',
  PERMISSION_CREATE: 'system:manage_roles',
  PERMISSION_UPDATE: 'system:manage_roles',
  PERMISSION_DELETE: 'system:manage_roles',
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PRODUCTION_OPERATOR: 'production_operator',
  SUPPORT_AGENT: 'support_agent',
  CONTENT_MANAGER: 'content_manager',
};

// Role hierarchy - higher index = more permissions
export const ROLE_HIERARCHY = [
  ROLES.CONTENT_MANAGER,
  ROLES.SUPPORT_AGENT,
  ROLES.PRODUCTION_OPERATOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];
