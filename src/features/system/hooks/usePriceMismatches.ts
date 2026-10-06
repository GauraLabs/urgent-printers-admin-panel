'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPriceMismatches,
  getPriceMismatchSummary,
  resolvePriceMismatch,
  type PriceMismatchFilters,
} from '@/lib/api/priceMismatches';

export function usePriceMismatches(filters: PriceMismatchFilters) {
  return useQuery({
    queryKey: ['price-mismatches', filters],
    queryFn: () => getPriceMismatches(filters),
    placeholderData: (prev) => prev,
  });
}

export function usePriceMismatchSummary(days = 7, enabled = true) {
  return useQuery({
    queryKey: ['price-mismatch-summary', days],
    enabled,
    queryFn: () => getPriceMismatchSummary(days),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useResolvePriceMismatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; resolved: boolean; note?: string }) =>
      resolvePriceMismatch(v.id, { resolved: v.resolved, ...(v.note !== undefined ? { note: v.note } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-mismatches'] });
      qc.invalidateQueries({ queryKey: ['price-mismatch-summary'] });
    },
  });
}
