'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  addOrderNote,
  cancelOrder,
} from '@/lib/api/orders';
import { createRefund } from '@/lib/api/payments';
import type { OrderFilters, OrderStatus } from '@/types';
import type { SortingState } from '@tanstack/react-table';
import type { CreateRefundRequest } from '@/types';

export function useOrders(initialFilters: OrderFilters = {}) {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    page_size: 20,
    ...initialFilters,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const query = useQuery({
    queryKey: ['orders', filters, sorting],
    queryFn: () =>
      getOrders({
        ...filters,
        sort_by: sorting[0]?.id,
        sort_dir: sorting[0]?.desc ? 'desc' : sorting[0] ? 'asc' : undefined,
      }),
    staleTime: 30_000,
  });

  function setPage(page: number) {
    setFilters((f) => ({ ...f, page }));
  }

  function setSearch(search: string) {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  }

  function setStatus(status: OrderStatus | undefined) {
    setFilters((f) => ({ ...f, status, page: 1 }));
  }

  function setTurnaround(turnaround: 'standard' | 'express' | 'rush' | undefined) {
    setFilters((f) => ({ ...f, turnaround, page: 1 }));
  }

  function setDateRange(from?: string, to?: string) {
    setFilters((f) => ({ ...f, date_from: from, date_to: to, page: 1 }));
  }

  return { query, filters, setPage, setSearch, setStatus, setTurnaround, setDateRange, sorting, setSorting };
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      updateOrderStatus(id, status, note),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
  });
}

export function useAddOrderNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => addOrderNote(id, content),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelOrder(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
  });
}

export function useCreateRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRefundRequest) => createRefund(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
