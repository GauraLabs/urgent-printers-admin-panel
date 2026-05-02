'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getCustomers, getCustomer, getCustomerActivity, updateCustomerStatus } from '@/lib/api/customers';
import { getOrders } from '@/lib/api/orders';
import type { CustomerFilters, CustomerStatus } from '@/types';

export function useCustomers() {
  const [filters, setFilters] = useState<CustomerFilters>({ page: 1, page_size: 20 });

  const query = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => getCustomers(filters),
    staleTime: 60_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setSearch: (search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })),
    setStatus: (status: CustomerStatus | undefined) => setFilters((f) => ({ ...f, status, page: 1 })),
    setDateRange: (from?: string, to?: string) => setFilters((f) => ({ ...f, date_from: from, date_to: to, page: 1 })),
    clearFilters: () => setFilters({ page: 1, page_size: 20 }),
  };
}

export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useCustomerActivity(id: string) {
  return useQuery({
    queryKey: ['customer-activity', id],
    queryFn: () => getCustomerActivity(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => getOrders({ page: 1, page_size: 20 }),
    staleTime: 60_000,
    enabled: !!customerId,
  });
}

export function useUpdateCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'banned' }) =>
      updateCustomerStatus(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer', id] });
    },
  });
}
