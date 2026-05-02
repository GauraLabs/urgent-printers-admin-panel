'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGeneralSettings, updateGeneralSettings,
  getOperationsSettings, updateOperationsSettings,
  getPaymentSettings, updatePaymentSettings,
  getNotificationSettings, updateNotificationSettings,
} from '@/lib/api/settings';

function settingsHook<T>(key: string, getFn: () => Promise<T>, updateFn: (d: Partial<T>) => Promise<T>) {
  return () => {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: [key], queryFn: getFn, staleTime: 5 * 60_000 });
    const mutation = useMutation({
      mutationFn: updateFn,
      onSuccess: (data) => qc.setQueryData([key], data),
    });
    return { query, mutation };
  };
}

export const useGeneralSettings = settingsHook('settings-general', getGeneralSettings, updateGeneralSettings);
export const useOperationsSettings = settingsHook('settings-operations', getOperationsSettings, updateOperationsSettings);
export const usePaymentSettings = settingsHook('settings-payments', getPaymentSettings, updatePaymentSettings);
export const useNotificationSettings = settingsHook('settings-notifications', getNotificationSettings, updateNotificationSettings);
