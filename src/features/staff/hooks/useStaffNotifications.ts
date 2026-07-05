'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStaffNotificationPreferences,
  upsertStaffNotificationPreference,
  type NotificationChannel,
  type NotificationEventType,
  type StaffNotificationPreferencesResponse,
  type UpsertStaffNotificationPreferenceRequest,
} from '@/lib/api/staffNotifications';
const STAFF_NOTIFICATIONS_KEY = ['staff-notification-preferences'];

export function useStaffNotificationPreferences(eventType: NotificationEventType) {
  return useQuery({
    queryKey: [...STAFF_NOTIFICATIONS_KEY, eventType],
    queryFn: () => getStaffNotificationPreferences(eventType),
    staleTime: 30_000,
  });
}

export function useToggleStaffNotificationPreference(eventType: NotificationEventType) {
  const qc = useQueryClient();
  const queryKey = [...STAFF_NOTIFICATIONS_KEY, eventType];

  return useMutation({
    mutationFn: (req: UpsertStaffNotificationPreferenceRequest) =>
      upsertStaffNotificationPreference(req),
    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<StaffNotificationPreferencesResponse>(queryKey);

      qc.setQueryData<StaffNotificationPreferencesResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.admin_user_id === req.admin_user_id
              ? {
                  ...item,
                  preferences: { ...item.preferences, [req.channel]: req.enabled },
                }
              : item
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _req, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}

export type { NotificationChannel, NotificationEventType };
