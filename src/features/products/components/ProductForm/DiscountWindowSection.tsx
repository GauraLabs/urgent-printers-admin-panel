'use client';

import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Badge, type BadgeVariant } from '@/components/common/StatusBadge';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/lib/utils/istDate';
import type { ProductDiscountStatus } from '@/types';
import type { ProductFormValues } from './schema';

const STATUS_CHIP: Record<ProductDiscountStatus, { label: string; variant: BadgeVariant } | null> = {
  none: null,
  scheduled: { label: 'Scheduled', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Ended', variant: 'default' },
};

interface Props {
  form: UseFormReturn<ProductFormValues>;
  status: ProductDiscountStatus;
}

export function DiscountWindowSection({ form, status }: Props) {
  const { watch, setValue, formState: { errors } } = form;
  const uid = useId();
  const chip = STATUS_CHIP[status];
  const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
  const labelCls = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';

  function field(name: 'discount_starts_at' | 'discount_ends_at', label: string) {
    const id = `${uid}-${name}`;
    return (
      <div data-field={name}>
        <label htmlFor={id} className={labelCls}>{label} (IST)</label>
        <input
          id={id}
          type="datetime-local"
          className={inputCls}
          value={utcIsoToIstLocal(watch(name))}
          onChange={(e) => setValue(name, istLocalToUtcIso(e.target.value), { shouldDirty: true, shouldValidate: true })}
        />
        {errors[name]?.message && <p className="mt-1 text-xs text-[var(--danger)]">{errors[name]?.message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-[var(--text-secondary)]">
          Outside this window, customers pay the MRP. Times are in India Standard Time (IST, UTC+05:30).
        </p>
        {chip && <Badge label={chip.label} variant={chip.variant} dot={false} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('discount_starts_at', 'Sale starts')}
        {field('discount_ends_at', 'Sale ends')}
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Leave both blank for a sale with no schedule (active whenever an MRP is set). The window only applies if at least one tier has an MRP.
      </p>
    </div>
  );
}
