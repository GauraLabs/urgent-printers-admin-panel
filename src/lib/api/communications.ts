import type { NotificationTemplate, PaginatedResponse } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export async function getTemplates(): Promise<NotificationTemplate[]> {
  await delay(300);
  return [
    { id: 'tmpl-1', name: 'Order Confirmed', type: 'email', subject: 'Your order {{order_number}} is confirmed!', body: 'Hi {{customer_name}}, your order {{order_number}} has been confirmed.', available_variables: ['customer_name', 'order_number', 'order_total'], is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'tmpl-2', name: 'Order Dispatched', type: 'email', subject: 'Your order {{order_number}} has been dispatched', body: 'Hi {{customer_name}}, your order is on its way! AWB: {{awb_number}}', available_variables: ['customer_name', 'order_number', 'awb_number', 'tracking_url'], is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'tmpl-3', name: 'Artwork Approval Needed', type: 'sms', subject: null, body: 'Urgent Printers: Your artwork for order {{order_number}} needs approval. Reply to proceed.', available_variables: ['customer_name', 'order_number'], is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
}

export async function updateTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
  await delay();
  const list = await getTemplates();
  return { ...list[0], ...data, id };
}

export interface CommunicationLog {
  id: string;
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject: string | null;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
}

export async function getCommunicationLog(filters: { page?: number } = {}): Promise<PaginatedResponse<CommunicationLog>> {
  await delay();
  const items: CommunicationLog[] = Array.from({ length: 20 }, (_, i) => ({
    id: `log-${i + 1}`,
    type: (['email', 'sms', 'push'] as const)[i % 3],
    recipient: ['rahul@example.com', '+91 98765 43210', 'device-token-xyz'][i % 3],
    subject: i % 3 === 0 ? 'Your order has been confirmed' : null,
    status: (['sent', 'sent', 'sent', 'failed'] as const)[i % 4],
    sent_at: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
  }));
  return { items, total: 1240, page: 1, page_size: 20, total_pages: 62 };
}

export async function sendNotification(data: {
  type: 'email' | 'sms' | 'push';
  recipients: 'all' | 'segment' | string[];
  subject?: string;
  message: string;
  template_id?: string;
}): Promise<{ success: boolean; sent_count: number }> {
  await delay();
  return { success: true, sent_count: typeof data.recipients === 'string' ? 1847 : data.recipients.length };
}
