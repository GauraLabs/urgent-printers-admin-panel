export * from './auth';
export * from './order';
export * from './product';
export * from './customer';
export * from './payment';
export * from './coupon';
export * from './report';

import type { ShipmentStatus, ShipmentSource } from './order';

export interface DashboardStats {
  revenue_today: number;
  revenue_today_change_pct: number;
  orders_today: number;
  orders_today_change_pct: number;
  active_orders: number;
  pending_artwork_approval: number;
  new_customers_today: number;
  new_customers_change_pct: number;
  failed_payments_today: number;
  revenue_sparkline: number[];
  orders_sparkline: number[];
  alerts: DashboardAlert[];
}

export interface DashboardAlert {
  id: string;
  type: 'artwork_pending' | 'order_stuck' | 'failed_payment' | 'low_product';
  severity: 'warning' | 'error';
  title: string;
  description: string;
  entity_id: string;
  entity_type: string;
  created_at: string;
}

export interface SystemHealth {
  services: ServiceStatus[];
  checked_at: string;
}

export type ServiceHealthCategory = 'infrastructure' | 'external';

// 'unknown' only ever appears for `category: 'external'` services that have
// never had a success or failure passively recorded yet.
export type ServiceHealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface ServiceStatus {
  name: string;
  display_name: string;
  category: ServiceHealthCategory;
  status: ServiceHealthStatus;
  message: string | null;
  // infrastructure services (postgresql/redis/celery) are live-polled and set these
  last_check?: string | null;
  response_time_ms?: number | null;
  // external services (razorpay/shiprocket/resend/r2) are passively tracked from
  // real traffic, never polled — they set these instead
  last_success_at?: string | null;
  last_failure_at?: string | null;
  last_error?: string | null;
}

export interface JobStatus {
  id: string;
  task_id: string;
  queue_name: string;
  job_type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  args: Record<string, unknown>;
  result: unknown;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject: string | null;
  body: string;
  available_variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface WhatsAppTemplateComponentExample {
  header_handle?: string[];
  header_text?: string[];
  body_text?: string[][];
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: WhatsAppTemplateButton[];
  example?: WhatsAppTemplateComponentExample;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'utility' | 'marketing' | 'authentication';
  language_code: string;
  meta_template_status: 'pending' | 'approved' | 'rejected';
  variable_schema: string[];
  version: number;
  is_active: boolean;
  components: WhatsAppTemplateComponent[];
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  image_url: string;
  thumb_url: string | null;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  sort_order: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_title: string | null;
  avatar_url: string | null;
  content: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  countdown_end_at: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface NavLink {
  id: string;
  label: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  custom_url: string | null;
  placement: 'header' | 'footer';
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type ThemePresetId = 'roseGold' | 'gold' | 'emerald' | 'slate' | 'pink' | 'plum';

export interface SiteTheme {
  id: string;
  preset_id: ThemePresetId;
  updated_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderHaltSetting {
  id: string;
  is_halted: boolean;
  customer_message: string | null;
  internal_reason: string | null;
  updated_by_admin_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  order_id: string;
  order_number: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
}

export interface Shipment {
  order_id: string;
  order_number: string;
  customer_name: string | null;
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipment_status: ShipmentStatus | null;
  shipment_source: ShipmentSource | null;
  dispatched_at: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}
