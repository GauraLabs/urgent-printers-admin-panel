'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCodSettings, updateCodSettings, type UpdateCodSettingsPayload } from '@/lib/api/codSettings';

export const COD_SETTINGS_QUERY_KEY = ['settings-cod'] as const;

export function useCodSettings(enabled = true) {
  return useQuery({
    queryKey: COD_SETTINGS_QUERY_KEY,
    queryFn: getCodSettings,
    staleTime: 60_000,
    enabled,
    retry: (count, err) => (err as { status?: number })?.status !== 403 && count < 2,
  });
}

export function useUpdateCodSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCodSettingsPayload) => updateCodSettings(payload),
    onSuccess: (data) => qc.setQueryData(COD_SETTINGS_QUERY_KEY, data),
  });
}
