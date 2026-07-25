'use client';

import { usePaymentSettings } from '../hooks/useSettings';
import { useSettingsForm, SettingsSection, FieldRow, SaveBar, fieldCls } from './SettingsForm';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { PaymentSettings as T } from '@/lib/api/settings';

export function PaymentSettings() {
  const { query, mutation } = usePaymentSettings();
  const { form, handleSave } = useSettingsForm<T>({
    data: query.data,
    isLoading: query.isLoading,
    onSave: (v) => mutation.mutateAsync(v),
  });

  const { register, handleSubmit, watch, setValue, formState: { isDirty, isSubmitting } } = form;

  if (query.isLoading) return <LoadingSkeleton rows={5} className="max-w-2xl" />;

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4 max-w-2xl">
      <SettingsSection title="Payment Gateways" description="Enable or disable payment methods.">
        <FieldRow label="Razorpay" description="Credit/debit cards, UPI, net banking.">
          <Switch checked={watch('razorpay_enabled') ?? false} onCheckedChange={(v) => setValue('razorpay_enabled', v, { shouldDirty: true })} size="sm" />
        </FieldRow>
        {watch('razorpay_enabled') && (
          <FieldRow label="Razorpay Key ID">
            <input {...register('razorpay_key_id')} className={fieldCls} placeholder="rzp_live_..." />
          </FieldRow>
        )}
        <FieldRow label="Paytm">
          <Switch checked={watch('paytm_enabled') ?? false} onCheckedChange={(v) => setValue('paytm_enabled', v, { shouldDirty: true })} size="sm" />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Cash on Delivery" description="COD availability and limits.">
        <FieldRow label="Enable COD">
          <Switch checked={watch('cod_enabled') ?? false} onCheckedChange={(v) => setValue('cod_enabled', v, { shouldDirty: true })} size="sm" />
        </FieldRow>
        {watch('cod_enabled') && (
          <FieldRow label="Minimum Order for COD" description="Orders below this cannot use COD.">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted-foreground">₹</span>
              <input {...register('cod_min_order', { valueAsNumber: true })} type="number" min={0} className={`${fieldCls} w-32`} />
            </div>
          </FieldRow>
        )}
      </SettingsSection>

      <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} />
    </form>
  );
}
