'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  addOrderNote,
  cancelOrder,
  presignProof,
  getOrderProofs,
  sendProofForApproval,
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

  function setTurnaround(turnaround: string | undefined) {
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
    mutationFn: ({ id, status, trackingNumber }: { id: string; status: OrderStatus; trackingNumber?: string }) =>
      updateOrderStatus(id, status, trackingNumber),
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

export function useOrderProofs(orderId: string) {
  return useQuery({
    queryKey: ['order-proofs', orderId],
    queryFn: () => getOrderProofs(orderId),
    staleTime: 30_000,
  });
}

export function usePresignProof() {
  return useMutation({
    mutationFn: ({ orderId, itemId, filename, mimeType, fileSize }: { orderId: string; itemId: string; filename: string; mimeType: string; fileSize: number }) =>
      presignProof(orderId, itemId, filename, mimeType, fileSize),
  });
}

export function useSendProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      sendProofForApproval(orderId, itemId),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['order-proofs', orderId] });
    },
  });
}
