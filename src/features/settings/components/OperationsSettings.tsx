'use client';

import { useOperationsSettings } from '../hooks/useSettings';
import { useSettingsForm, SettingsLoadError, SettingsSection, FieldRow, SaveBar, fieldCls } from './SettingsForm';
import { EmergencyOrderHalt } from './EmergencyOrderHalt';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { OperationsSettings as T } from '@/lib/api/settings';

export function OperationsSettings() {
  const { query, mutation } = useOperationsSettings();
  const { form, handleSave } = useSettingsForm<T>({
    data: query.data,
    isLoading: query.isLoading,
    onSave: (v) => mutation.mutateAsync(v),
  });

  const { register, handleSubmit, watch, setValue, formState: { isDirty, isSubmitting } } = form;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Own immediate-save mutation, independent of the batched form below —
          a kill switch must never sit un-submitted behind an unrelated
          turnaround-field edit. See EmergencyOrderHalt.tsx / useOrderHalt.ts. */}
      <EmergencyOrderHalt />

      {query.isError ? <SettingsLoadError retry={() => { void query.refetch(); }} /> : query.isLoading ? (
        <LoadingSkeleton rows={5} className="max-w-2xl" />
      ) : (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <SettingsSection title="Turnaround" description="Default turnaround is used when a product has no turnaround configured. Capacity values below are saved planning targets; they do not reject orders automatically.">
            <FieldRow label="Default Turnaround" description="Standard delivery days.">
              <div className="flex items-center gap-2">
                <input {...register('default_turnaround_days', { valueAsNumber: true })} type="number" min={1} className={`${fieldCls} w-24`} />
                <span className="text-[13px] text-muted-foreground">days</span>
              </div>
            </FieldRow>
            <FieldRow label="Max Rush Orders / Day" description="Saved daily planning target.">
              <input {...register('max_rush_orders_per_day', { valueAsNumber: true })} type="number" min={0} className={`${fieldCls} w-24`} />
            </FieldRow>
            <FieldRow label="Printing Capacity / Day" description="Saved daily planning target.">
              <input {...register('printing_capacity_per_day', { valueAsNumber: true })} type="number" min={1} className={`${fieldCls} w-24`} />
            </FieldRow>
          </SettingsSection>

          <SettingsSection title="Artwork" description="Artwork approval rules.">
            <FieldRow label="Approval Timeout" description="Saved review target; automatic escalation is not enabled.">
              <div className="flex items-center gap-2">
                <input {...register('artwork_approval_timeout_hours', { valueAsNumber: true })} type="number" min={1} className={`${fieldCls} w-24`} />
                <span className="text-[13px] text-muted-foreground">hours</span>
              </div>
            </FieldRow>
            <FieldRow label="Auto-approve Reorders" description="Not available yet. Reorders continue through artwork review.">
              <Switch disabled checked={watch('auto_approve_reorders') ?? false} onCheckedChange={(v) => setValue('auto_approve_reorders', v, { shouldDirty: true })} size="sm" />
            </FieldRow>
          </SettingsSection>

          <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} />
        </form>
      )}
    </div>
  );
}
