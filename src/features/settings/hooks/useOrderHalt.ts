'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderHalt, updateOrderHalt, type UpdateOrderHaltPayload } from '@/lib/api/orderHalt';

// Deliberately separate from useSettings.ts's `settingsHook` factory /
// useSettingsForm+SaveBar batched-dirty-state flow: this is a kill switch,
// it must save immediately on toggle and never sit un-submitted behind an
// unrelated field's pending changes elsewhere on the Operations page.
export const ORDER_HALT_QUERY_KEY = ['order-halt'] as const;

export function useOrderHaltStatus() {
  return useQuery({
    queryKey: ORDER_HALT_QUERY_KEY,
    queryFn: getOrderHalt,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useOrderHaltMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrderHaltPayload) => updateOrderHalt(payload),
    onSuccess: (data) => qc.setQueryData(ORDER_HALT_QUERY_KEY, data),
  });
}
