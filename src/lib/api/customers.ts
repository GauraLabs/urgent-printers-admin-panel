import { get, patch } from './client';
import type { Customer, CustomerWithDetails, CustomersListResponse, CustomerFilters, CustomerActivity } from '@/types';

interface RawListResponse {
  items: Customer[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export async function getCustomers(filters: CustomerFilters = {}): Promise<CustomersListResponse> {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    page_size: filters.page_size ?? 20,
  };
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_dir) params.sort_dir = filters.sort_dir;

  return get<RawListResponse>('/admin/customers', params);
}

export async function getCustomer(id: string): Promise<CustomerWithDetails> {
  return get<CustomerWithDetails>(`/admin/customers/${id}`);
}

export async function getCustomerActivity(id: string): Promise<CustomerActivity[]> {
  return get<CustomerActivity[]>(`/admin/customers/${id}/activity`, { limit: 50 });
}

export async function updateCustomerStatus(id: string, status: 'active' | 'banned'): Promise<void> {
  await patch(`/admin/customers/${id}/status`, { status });
}
