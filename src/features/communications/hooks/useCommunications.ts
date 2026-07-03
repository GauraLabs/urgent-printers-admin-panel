'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTemplates,
  updateTemplate,
  getCommunicationLog,
  sendNotification,
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
  syncWhatsAppTemplates,
  type WhatsAppTemplatesParams,
  type CreateWhatsAppTemplatePayload,
} from '@/lib/api/communications';

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

const WA_TEMPLATES_KEY = 'whatsapp-templates';

export function useWhatsAppTemplates(params: WhatsAppTemplatesParams = {}) {
  return useQuery({
    queryKey: [WA_TEMPLATES_KEY, params],
    queryFn: () => getWhatsAppTemplates(params),
    staleTime: 60_000,
  });
}

export function useCreateWhatsAppTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWhatsAppTemplatePayload) => createWhatsAppTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WA_TEMPLATES_KEY] }),
  });
}

export function useSyncWhatsAppTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: syncWhatsAppTemplates,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [WA_TEMPLATES_KEY] });
      toast.success(
        `Synced ${result.synced} templates (${result.created} new, ${result.updated} updated)`,
      );
    },
    onError: () => {
      toast.error('Failed to sync templates from Meta');
    },
  });
}

export function useUpdateWhatsAppTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateWhatsAppTemplate>[1] }) =>
      updateWhatsAppTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WA_TEMPLATES_KEY] }),
  });
}

export function useDeleteWhatsAppTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWhatsAppTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WA_TEMPLATES_KEY] }),
  });
}
