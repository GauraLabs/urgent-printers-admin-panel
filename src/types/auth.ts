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
  permissions: Permission[];
  avatar: string | null;
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

export interface ActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_role: Role;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
}
