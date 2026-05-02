'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplates, updateTemplate, getCommunicationLog, sendNotification } from '@/lib/api/communications';

export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: getTemplates, staleTime: 60_000 });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTemplate>[1] }) =>
      updateTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useCommunicationLog(page = 1) {
  return useQuery({
    queryKey: ['comm-log', page],
    queryFn: () => getCommunicationLog({ page }),
    staleTime: 30_000,
  });
}

export function useSendNotification() {
  return useMutation({ mutationFn: sendNotification });
}
