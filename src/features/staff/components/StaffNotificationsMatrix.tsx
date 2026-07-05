'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Mail, MessageSquare, Smartphone, MessageCircle, Info, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ROUTES } from '@/lib/constants/routes';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useStaffNotificationPreferences,
  useToggleStaffNotificationPreference,
} from '../hooks/useStaffNotifications';
import type { NotificationChannel, NotificationEventType } from '@/lib/api/staffNotifications';
import type { ApiError } from '@/types';

// Adding a new event type later = one more entry here + a QUERY for each in
// the parent (see EVENT_TABS below). No structural change to the matrix.
const EVENT_TABS: { value: NotificationEventType; label: string }[] = [
  { value: 'order.created', label: 'New Order Placed' },
  { value: 'order.status_changed', label: 'Order Status Changed' },
];

const CHANNELS: { key: NotificationChannel; label: string; icon: React.ElementType; requiresPhone?: boolean }[] = [
  { key: 'in_app', label: 'In-App', icon: Bell },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageSquare, requiresPhone: true },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, requiresPhone: true },
  { key: 'push', label: 'Push', icon: Smartphone },
];

function EventPreferencesMatrix({ eventType }: { eventType: NotificationEventType }) {
  const { data, isLoading } = useStaffNotificationPreferences(eventType);
  const toggleMutation = useToggleStaffNotificationPreference(eventType);
  const [pendingCell, setPendingCell] = useState<string | null>(null);

  function cellKey(adminUserId: string, channel: NotificationChannel): string {
    return `${adminUserId}:${channel}`;
  }

  async function handleToggle(adminUserId: string, channel: NotificationChannel, enabled: boolean) {
    const key = cellKey(adminUserId, channel);
    setPendingCell(key);
    try {
      await toggleMutation.mutateAsync({ admin_user_id: adminUserId, event_type: eventType, channel, enabled });
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message ?? 'Failed to update notification preference');
    } finally {
      setPendingCell(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground py-8 text-center">
        No staff members found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-56 sticky left-0 bg-muted/50">
                Staff Member
              </th>
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                return (
                  <th key={ch.key} className="px-3 py-3 text-center font-semibold text-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {ch.label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.items.map((staff) => (
              <tr key={staff.admin_user_id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 sticky left-0 bg-card">
                  <p className="font-medium text-foreground">{staff.name}</p>
                  <p className="text-[11px] text-muted-foreground">{staff.email}</p>
                </td>
                {CHANNELS.map((ch) => {
                  const disabled = ch.requiresPhone === true && !staff.has_phone_number;
                  const key = cellKey(staff.admin_user_id, ch.key);
                  const isPending = pendingCell === key && toggleMutation.isPending;
                  return (
                    <td key={ch.key} className="px-3 py-2.5 text-center">
                      <div
                        className="inline-flex items-center justify-center"
                        title={disabled ? `${staff.name} has no phone number on file — add one to enable ${ch.label}` : undefined}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            size="sm"
                            checked={staff.preferences[ch.key] ?? false}
                            disabled={disabled}
                            onCheckedChange={(v) => handleToggle(staff.admin_user_id, ch.key, v)}
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.items.some((s) => !s.has_phone_number) && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40 text-[12px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>
            SMS and WhatsApp are disabled for staff without a phone number on file. Add one from the{' '}
            <Link href={ROUTES.STAFF} className="text-primary underline underline-offset-2">
              Staff page
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export function StaffNotificationsMatrix() {
  const { canManageStaff } = usePermissions();

  if (!canManageStaff) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-[14px] font-semibold text-foreground">Access restricted</p>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          You need the &ldquo;Manage Staff&rdquo; permission to configure staff notification preferences.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={EVENT_TABS[0].value}>
      {EVENT_TABS.length > 1 && (
        <TabsList className="mb-4">
          {EVENT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      )}
      {EVENT_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <EventPreferencesMatrix eventType={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
