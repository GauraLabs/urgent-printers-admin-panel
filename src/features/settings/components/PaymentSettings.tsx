'use client';

import { usePaymentSettings } from '../hooks/useSettings';
import { useSettingsForm, SettingsLoadError, SettingsSection, FieldRow, SaveBar, fieldCls } from './SettingsForm';
import { CodSettings } from './CodSettings';
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

  if (query.isError) return <><SettingsLoadError retry={() => { void query.refetch(); }} /><CodSettings /></>;

  if (query.isLoading) return <LoadingSkeleton rows={5} className="max-w-2xl" />;

  return (
    <div className="space-y-4">
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4 max-w-2xl">
      <SettingsSection title="Payment Gateways" description="Control new online orders. Existing orders can still complete payment. Provider credentials are managed securely on the server.">
        <FieldRow label="Razorpay" description="Credit/debit cards, UPI, net banking.">
          <Switch checked={watch('razorpay_enabled') ?? false} onCheckedChange={(v) => setValue('razorpay_enabled', v, { shouldDirty: true })} size="sm" />
        </FieldRow>
        {watch('razorpay_enabled') && (
          <FieldRow label="Razorpay Key ID">
            <input {...register('razorpay_key_id')} readOnly aria-readonly="true" className={fieldCls} placeholder="Not configured on server" />
          </FieldRow>
        )}
        <FieldRow label="Paytm" description="Not available yet.">
          <Switch disabled checked={watch('paytm_enabled') ?? false} onCheckedChange={(v) => setValue('paytm_enabled', v, { shouldDirty: true })} size="sm" />
        </FieldRow>
      </SettingsSection>

      <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} />
    </form>
    <CodSettings />
    </div>
  );
}
