'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrder } from '@/lib/api/orders';

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}
