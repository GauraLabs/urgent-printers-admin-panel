'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AdminNotification,
  type GetAdminNotificationsParams,
} from '@/lib/api/adminNotifications';
import type { PaginatedResponse } from '@/types';

const NOTIFICATIONS_KEY = ['admin-notifications'];

export function useAdminNotifications(params: GetAdminNotificationsParams = {}) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn: () => getAdminNotifications(params),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const previous = qc.getQueriesData<PaginatedResponse<AdminNotification>>({
        queryKey: NOTIFICATIONS_KEY,
      });

      qc.setQueriesData<PaginatedResponse<AdminNotification>>(
        { queryKey: NOTIFICATIONS_KEY },
        (old) =>
          old
            ? { ...old, items: old.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)) }
            : old
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export type { AdminNotification };
