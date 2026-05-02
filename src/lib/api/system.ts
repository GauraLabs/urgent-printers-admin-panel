import type { SystemHealth, JobStatus } from '@/types';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 300));
}

export async function getSystemHealth(): Promise<SystemHealth> {
  await delay();
  return {
    services: [
      { name: 'FastAPI Backend', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: 45, error_rate: 0.1, message: null },
      { name: 'PostgreSQL', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: 8, error_rate: 0, message: null },
      { name: 'Redis', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: 2, error_rate: 0, message: null },
      { name: 'Razorpay', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: 120, error_rate: 0.5, message: null },
      { name: 'Shiprocket', status: 'degraded', last_check: new Date().toISOString(), response_time_ms: 2400, error_rate: 3.2, message: 'High response times detected' },
      { name: 'SendGrid', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: 340, error_rate: 0.2, message: null },
      { name: 'Celery Workers', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: null, error_rate: 0, message: '4 workers active' },
      { name: 'S3 Storage', status: 'healthy', last_check: new Date().toISOString(), response_time_ms: 85, error_rate: 0, message: null },
    ],
    checked_at: new Date().toISOString(),
  };
}

export async function getJobQueue(): Promise<JobStatus[]> {
  await delay();
  return Array.from({ length: 12 }, (_, i) => ({
    id: `job-${i + 1}`,
    queue_name: ['default', 'emails', 'shipping', 'reports'][i % 4],
    job_type: ['send_email', 'create_shipment', 'generate_report', 'process_payment'][i % 4],
    status: (['completed', 'completed', 'processing', 'failed', 'queued'] as const)[i % 5],
    args: { order_id: `ord-${i}` },
    result: i % 5 !== 3 ? { success: true } : null,
    error_message: i % 5 === 3 ? 'Connection timeout' : null,
    retry_count: i % 5 === 3 ? 2 : 0,
    created_at: new Date(Date.now() - i * 1000 * 60 * 5).toISOString(),
    started_at: new Date(Date.now() - i * 1000 * 60 * 4).toISOString(),
    completed_at: i % 5 !== 2 ? new Date(Date.now() - i * 1000 * 60 * 3).toISOString() : null,
  }));
}

export interface ErrorLogEntry {
  id: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  stack: string | null;
  endpoint: string | null;
  user_id: string | null;
  created_at: string;
}

export async function getErrorLog(): Promise<ErrorLogEntry[]> {
  await delay();
  return Array.from({ length: 15 }, (_, i) => ({
    id: `err-${i + 1}`,
    level: (['error', 'warning', 'critical', 'error', 'warning'] as const)[i % 5],
    message: ['Database connection timeout', 'Invalid artwork format uploaded', 'Razorpay webhook signature mismatch', 'S3 upload failed', 'Email delivery failed'][i % 5],
    stack: null,
    endpoint: ['/api/v1/orders', '/api/v1/products', '/api/v1/payments/webhook', null, null][i % 5],
    user_id: i % 3 === 0 ? `cust-${i}` : null,
    created_at: new Date(Date.now() - i * 1000 * 60 * 45).toISOString(),
  }));
}
