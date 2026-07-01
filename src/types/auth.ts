export type Role =
  | 'super_admin'
  | 'operations_manager'
  | 'customer_support'
  | 'catalogue_manager'
  | 'finance'
  | 'marketing';

export type Permission =
  | 'orders.view'
  | 'orders.edit'
  | 'orders.cancel'
  | 'orders.refund'
  | 'orders.manage_proofs'
  | 'printing_queue.view'
  | 'printing_queue.manage'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'categories.view'
  | 'categories.manage'
  | 'customers.view'
  | 'customers.edit'
  | 'customers.ban'
  | 'payments.view'
  | 'payments.refund'
  | 'coupons.view'
  | 'coupons.manage'
  | 'content.view'
  | 'content.manage'
  | 'reviews.view'
  | 'reviews.moderate'
  | 'shipping.view'
  | 'shipping.manage'
  | 'communications.view'
  | 'communications.send'
  | 'reports.sales'
  | 'reports.orders'
  | 'reports.customers'
  | 'reports.operations'
  | 'staff.view'
  | 'staff.manage'
  | 'settings.view'
  | 'settings.manage'
  | 'system.view';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Extra permissions granted on top of the role's defaults */
  granted_permissions: Permission[];
  /** Permissions removed from the role's defaults for this specific user */
  revoked_permissions: Permission[];
  /**
   * Effective permissions pre-computed by the backend:
   * = role_defaults + granted_permissions - revoked_permissions
   * Frontend reads this for all permission checks.
   */
  permissions: Permission[];
  avatar_url: string | null;
  last_login: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AdminUser;
}

/**
 * Activity log entry — matches backend shape exactly.
 * Actor's name/role are NOT included; frontend looks them up from the staff
 * list cache via the actor_admin_id.
 */
export interface ActivityLog {
  id: string;
  actor_admin_id: string;
  action: string;            // e.g. "staff.created", "admin.login"
  resource_type: string;     // e.g. "admin_user"
  resource_id: string | null;
  meta: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}
