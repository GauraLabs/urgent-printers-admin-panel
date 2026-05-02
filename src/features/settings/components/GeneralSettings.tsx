'use client';

import { useGeneralSettings } from '../hooks/useSettings';
import { useSettingsForm, SettingsSection, FieldRow, SaveBar, fieldCls } from './SettingsForm';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { GeneralSettings as T } from '@/lib/api/settings';

export function GeneralSettings() {
  const { query, mutation } = useGeneralSettings();
  const { form, handleSave } = useSettingsForm<T>({
    data: query.data,
    isLoading: query.isLoading,
    onSave: (v) => mutation.mutateAsync(v),
  });

  const { register, handleSubmit, formState: { isDirty, isSubmitting } } = form;

  if (query.isLoading) return <LoadingSkeleton rows={6} className="max-w-2xl" />;

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4 max-w-2xl">
      <SettingsSection title="Business Info" description="Your public-facing business details.">
        <FieldRow label="Business Name">
          <input {...register('site_name')} className={fieldCls} />
        </FieldRow>
        <FieldRow label="GST Number">
          <input {...register('gst_number')} className={fieldCls} placeholder="29AABCU9603R1ZX" />
        </FieldRow>
        <FieldRow label="Address" description="Used on invoices and receipts.">
          <textarea {...register('address')} rows={2} className={`${fieldCls} resize-none`} />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Contact" description="Support contact details shown to customers.">
        <FieldRow label="Support Email">
          <input {...register('support_email')} type="email" className={fieldCls} />
        </FieldRow>
        <FieldRow label="Support Phone">
          <input {...register('support_phone')} className={fieldCls} placeholder="+91 98765 00000" />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title="Localisation">
        <FieldRow label="Timezone">
          <select {...register('timezone')} className={fieldCls}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="UTC">UTC</option>
          </select>
        </FieldRow>
        <FieldRow label="Currency">
          <select {...register('currency')} className={fieldCls}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </FieldRow>
      </SettingsSection>

      <SaveBar isDirty={isDirty} isSubmitting={isSubmitting} />
    </form>
  );
}
