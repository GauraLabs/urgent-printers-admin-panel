'use client';

import { useNotificationSettings } from '../hooks/useSettings';
import { useSettingsForm, SettingsSection, FieldRow, SaveBar } from './SettingsForm';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { NotificationSettings as T } from '@/lib/api/settings';

interface ToggleRowProps {
  label: string;
  description?: string;
  emailKey: keyof T;
  smsKey?: keyof T;
  watch: (k: keyof T) => boolean;
  setValue: (k: keyof T, v: boolean, opts?: { shouldDirty: boolean }) => void;
}

function ToggleRow({ label, description, emailKey, smsKey, watch, setValue }: ToggleRowProps) {
  return (
    <FieldRow label={label} description={description}>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={watch(emailKey)} onCheckedChange={(v) => setValue(emailKey, v, { shouldDirty: true })} size="sm" />
          <span className="text-[13px] text-muted-foreground">Email</span>
        </label>
        {smsKey && (
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={watch(smsKey)} onCheckedChange={(v) => setValue(smsKey, v, { shouldDirty: true })} size="sm" />
            <span className="text-[13px] text-muted-foreground">SMS</span>
          </label>
        )}
      </div>
    </FieldRow>
  );
}

export function NotificationSettings() {
  const { query, mutation } = useNotificationSettings();
  const { form, handleSave } = useSettingsForm<T>({
    data: query.data,
    isLoading: query.isLoading,
    onSave: (v) => mutation.mutateAsync(v),
  });

  const { handleSubmit, watch, setValue, formState: { isDirty, isSubmitting } } = form;
  const w = (k: keyof T) => (watch(k) as boolean | undefined) ?? false;
  const sv = (k: keyof T, v: boolean, opts?: { shouldDirty: boolean }) => setValue(k, v as never, opts);

  if (query.isLoading) return <LoadingSkeleton rows={6} className="max-w-2xl" />;

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4 max-w-2xl">
      <SettingsSection title="Customer Notifications" description="Sent to customers at key order milestones.">
        <ToggleRow label="Order Confirmed" emailKey="order_confirmed_email" smsKey="order_confirmed_sms" watch={w} setValue={sv} />
        <ToggleRow label="Order Dispatched" emailKey="order_dispatched_email" smsKey="order_dispatched_sms" watch={w} setValue={sv} />
        <ToggleRow label="Artwork Approval Needed" emailKey="artwork_pending_email" smsKey="artwork_pending_sms" watch={w} setValue={sv} />
      </SettingsSection>

      <SettingsSection title="Admin Alerts" description="Internal alerts sent to the operations team.">
        <ToggleRow label="New Order Received" emailKey="admin_new_order_email" watch={w} setValue={sv} />
        <ToggleRow label="Failed Payment" emailKey="admin_failed_payment_email" watch={w} setValue={sv} />
      </SettingsSection>

      <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} />
    </form>
  );
}
