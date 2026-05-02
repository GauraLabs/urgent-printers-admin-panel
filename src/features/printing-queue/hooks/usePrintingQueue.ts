'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPrintingQueueAll,
  approveArtwork,
  requestReupload,
  startPrinting,
  markReadyToDispatch,
  createShipmentsBulk,
} from '@/lib/api/printingQueue';
import type { QueueStatus } from '@/lib/api/printingQueue';

const QUEUE_KEY = ['printing-queue'];

export function usePrintingQueue() {
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: getPrintingQueueAll,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useQueueCounts() {
  const { data } = usePrintingQueue();
  return {
    artwork_pending: data?.filter((i) => i.status === 'artwork_pending').length ?? 0,
    artwork_approved: data?.filter((i) => i.status === 'artwork_approved').length ?? 0,
    printing: data?.filter((i) => i.status === 'printing').length ?? 0,
    ready_to_dispatch: data?.filter((i) => i.status === 'ready_to_dispatch').length ?? 0,
  };
}

function makeQueueMutation<TArgs>(
  fn: (args: TArgs) => Promise<{ success: boolean }>
) {
  return () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: fn,
      onSuccess: () => qc.invalidateQueries({ queryKey: QUEUE_KEY }),
    });
  };
}

export const useApproveArtwork = makeQueueMutation(
  ({ orderId }: { orderId: string }) => approveArtwork(orderId)
);

export const useRequestReupload = makeQueueMutation(
  ({ orderId, reason }: { orderId: string; reason: string }) => requestReupload(orderId, reason)
);

export const useStartPrinting = makeQueueMutation(
  ({ orderId }: { orderId: string }) => startPrinting(orderId)
);

export const useMarkReadyToDispatch = makeQueueMutation(
  ({ orderId }: { orderId: string }) => markReadyToDispatch(orderId)
);

export function useCreateShipmentsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createShipmentsBulk,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUEUE_KEY });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
