function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}

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
  cod_enabled: boolean;
  cod_min_order: number;
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

export async function getGeneralSettings(): Promise<GeneralSettings> {
  await delay();
  return { site_name: 'Urgent Printers', support_email: 'support@urgentprinters.com', support_phone: '+91 98765 00000', gst_number: '29AABCU9603R1ZX', address: 'MG Road, Bengaluru, Karnataka 560001', timezone: 'Asia/Kolkata', currency: 'INR', logo_url: null };
}

export async function updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
  await delay();
  return { ...await getGeneralSettings(), ...data };
}

export async function getOperationsSettings(): Promise<OperationsSettings> {
  await delay();
  return { default_turnaround_days: 5, max_rush_orders_per_day: 20, artwork_approval_timeout_hours: 24, auto_approve_reorders: false, printing_capacity_per_day: 200 };
}

export async function updateOperationsSettings(data: Partial<OperationsSettings>): Promise<OperationsSettings> {
  await delay();
  return { ...await getOperationsSettings(), ...data };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  await delay();
  return { razorpay_enabled: true, paytm_enabled: false, cod_enabled: true, cod_min_order: 1000, razorpay_key_id: 'rzp_test_xxx' };
}

export async function updatePaymentSettings(data: Partial<PaymentSettings>): Promise<PaymentSettings> {
  await delay();
  return { ...await getPaymentSettings(), ...data };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  await delay();
  return { order_confirmed_email: true, order_confirmed_sms: true, order_dispatched_email: true, order_dispatched_sms: true, artwork_pending_email: true, artwork_pending_sms: false, admin_new_order_email: true, admin_failed_payment_email: true };
}

export async function updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
  await delay();
  return { ...await getNotificationSettings(), ...data };
}
