'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commitBulkDiscount, getBulkDiscountBatches, previewBulkDiscount, undoBulkDiscount,
} from '@/lib/api/productDiscounts';
import type { BulkDiscountRequest } from '@/types';

const BATCHES_KEY = ['product-discount-batches'];

type BulkParams = Pick<BulkDiscountRequest, 'action' | 'scope' | 'percent' | 'starts_at' | 'ends_at' | 'overwrite_existing'>;

export function useBulkDiscountPreview() {
  return useMutation({ mutationFn: (params: BulkParams) => previewBulkDiscount(params) });
}

function useInvalidateCatalogue() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['product'] });
    qc.invalidateQueries({ queryKey: BATCHES_KEY });
  };
}

export function useBulkDiscountCommit() {
  const invalidate = useInvalidateCatalogue();
  return useMutation({
    mutationFn: ({ params, token }: { params: BulkParams; token: string }) => commitBulkDiscount(params, token),
    onSuccess: invalidate,
  });
}

export function useBulkDiscountUndo() {
  const invalidate = useInvalidateCatalogue();
  return useMutation({
    mutationFn: (batchId: string) => undoBulkDiscount(batchId),
    onSuccess: invalidate,
  });
}

export function useBulkDiscountBatches(enabled: boolean) {
  return useQuery({
    queryKey: BATCHES_KEY,
    queryFn: () => getBulkDiscountBatches(20),
    enabled,
    staleTime: 15_000,
  });
}
