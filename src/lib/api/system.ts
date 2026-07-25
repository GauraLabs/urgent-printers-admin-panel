import { get, post } from './client';
import type { SystemHealth, ServiceStatus, JobStatus } from '@/types';

export async function getSystemHealth(): Promise<SystemHealth> {
  return get<SystemHealth>('/admin/system/health');
}

export const FORCE_CHECKABLE_SERVICES = [
  'postgresql', 'redis', 'celery', 'razorpay', 'shiprocket', 'resend', 'r2',
] as const;
export type ForceCheckableService = (typeof FORCE_CHECKABLE_SERVICES)[number];

export async function forceCheckService(service: ForceCheckableService): Promise<ServiceStatus> {
  return post<ServiceStatus>(`/admin/system/health/${service}/check`);
}

interface RawJobRun {
  id: number;
  task_id: string;
  queue_name: string;
  job_type: string;
  status: JobStatus['status'];
  args: Record<string, unknown>;
  result: unknown;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface JobRunListResponse {
  items: RawJobRun[];
  total: number;
  offset: number;
  limit: number;
}

function normaliseJobRun(raw: RawJobRun): JobStatus {
  return { ...raw, id: String(raw.id) };
}

export async function getJobQueue(): Promise<JobStatus[]> {
  const { items } = await get<JobRunListResponse>('/admin/system/jobs', { limit: 50 });
  return items.map(normaliseJobRun);
}

export interface ErrorLogEntry {
  id: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  stack: string | null;
  endpoint: string | null;
  http_method: string | null;
  actor_type: string | null;
  user_id: string | null;
  created_at: string;
}

export async function getErrorLog(): Promise<ErrorLogEntry[]> {
  return get<ErrorLogEntry[]>('/admin/system/errors', { limit: 200 });
}

export async function getErrorLogEntry(entryId: string): Promise<ErrorLogEntry> {
  return get<ErrorLogEntry>(`/admin/system/errors/${entryId}`);
}
