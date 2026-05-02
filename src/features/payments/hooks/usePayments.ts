'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getPayments, getRefunds } from '@/lib/api/payments';
import type { PaymentFilters } from '@/types';

export function usePayments() {
  const [filters, setFilters] = useState<PaymentFilters>({ page: 1, page_size: 20 });

  const query = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => getPayments(filters),
    staleTime: 30_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setSearch: (search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })),
    setStatus: (status: PaymentFilters['status']) => setFilters((f) => ({ ...f, status, page: 1 })),
    setDateRange: (from?: string, to?: string) => setFilters((f) => ({ ...f, date_from: from, date_to: to, page: 1 })),
    clearFilters: () => setFilters({ page: 1, page_size: 20 }),
  };
}

export function useRefunds() {
  const [filters, setFilters] = useState<PaymentFilters>({ page: 1, page_size: 20 });

  const query = useQuery({
    queryKey: ['refunds', filters],
    queryFn: () => getRefunds(filters),
    staleTime: 30_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setStatus: (status: PaymentFilters['status']) => setFilters((f) => ({ ...f, status, page: 1 })),
    clearFilters: () => setFilters({ page: 1, page_size: 20 }),
  };
}
