import { get, put } from './client';

export interface GeneralSettings {
  site_name: string;
  support_email: string;
  support_phone: string;
  gst_number: string;
  address: string;
  timezone: string;
  currency: string;
  logo_url: string | null;
}

export interface OperationsSettings {
  default_turnaround_days: number;
  max_rush_orders_per_day: number;
  artwork_approval_timeout_hours: number;
  auto_approve_reorders: boolean;
  printing_capacity_per_day: number;
}

export interface PaymentSettings {
  razorpay_enabled: boolean;
  paytm_enabled: boolean;
  razorpay_key_id: string;
}

export interface NotificationSettings {
  order_confirmed_email: boolean;
  order_confirmed_sms: boolean;
  order_dispatched_email: boolean;
  order_dispatched_sms: boolean;
  artwork_pending_email: boolean;
  artwork_pending_sms: boolean;
  admin_new_order_email: boolean;
  admin_failed_payment_email: boolean;
}

export const getGeneralSettings = () => get<GeneralSettings>('/admin/settings/general');
export const updateGeneralSettings = (data: Partial<GeneralSettings>) => put<GeneralSettings>('/admin/settings/general', data);
export const getOperationsSettings = () => get<OperationsSettings>('/admin/settings/operations');
export const updateOperationsSettings = (data: Partial<OperationsSettings>) => put<OperationsSettings>('/admin/settings/operations', data);
export const getPaymentSettings = () => get<PaymentSettings>('/admin/settings/payments');
export const updatePaymentSettings = (data: Partial<PaymentSettings>) => put<PaymentSettings>('/admin/settings/payments', data);
export const getNotificationSettings = () => get<NotificationSettings>('/admin/settings/notifications');
export const updateNotificationSettings = (data: Partial<NotificationSettings>) => put<NotificationSettings>('/admin/settings/notifications', data);
