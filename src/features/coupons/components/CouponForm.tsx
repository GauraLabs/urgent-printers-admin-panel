'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSaveCoupon } from '../hooks/useCoupons';
import { ROUTES } from '@/lib/constants/routes';
import type { Coupon } from '@/types';

const schema = z.object({
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive('Must be greater than 0'),
  min_order_amount: z.number().nonnegative().optional(),
  max_discount_amount: z.number().positive().optional(),
  usage_limit: z.number().positive().optional(),
  per_user_limit: z.number().positive().optional(),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_until: z.string().optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const labelCls = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';
const errorCls = 'mt-1 text-xs text-[var(--danger)]';

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const mutation = useSaveCoupon();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: coupon ? {
      code: coupon.code,
      description: coupon.description ?? '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount ?? undefined,
      max_discount_amount: coupon.max_discount_amount ?? undefined,
      usage_limit: coupon.usage_limit ?? undefined,
      per_user_limit: coupon.per_user_limit ?? undefined,
      valid_from: coupon.valid_from.slice(0, 10),
      valid_until: coupon.valid_until?.slice(0, 10) ?? '',
      is_active: coupon.status === 'active',
    } : {
      discount_type: 'percentage',
      discount_value: 10,
      valid_from: new Date().toISOString().slice(0, 10),
      is_active: true,
    },
  });

  const discountType = watch('discount_type');

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({
        id: coupon?.id,
        data: {
          code: values.code,
          description: values.description,
          discount_type: values.discount_type,
          discount_value: values.discount_value,
          min_order_amount: values.min_order_amount,
          max_discount_amount: values.max_discount_amount,
          usage_limit: values.usage_limit,
          per_user_limit: values.per_user_limit,
          valid_from: values.valid_from,
          valid_until: values.valid_until || undefined,
        },
      });
      toast.success(coupon ? 'Coupon updated' : 'Coupon created');
      router.push(ROUTES.COUPONS);
    } catch {
      toast.error('Failed to save coupon');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      {/* Code + description */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Coupon Code *</label>
          <input {...register('code')} className={`${inputCls} font-mono uppercase tracking-wider`} placeholder="SAVE10" />
          {errors.code && <p className={errorCls}>{errors.code.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <input {...register('description')} className={inputCls} placeholder="10% off all orders" />
        </div>
      </div>

      {/* Discount */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-[var(--text-primary)]">Discount</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Type *</label>
            <Select value={discountType} onValueChange={(v) => setValue('discount_type', (v ?? 'percentage') as 'percentage' | 'fixed', { shouldValidate: true })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCls}>Value * {discountType === 'percentage' ? '(%)' : '(₹)'}</label>
            <input {...register('discount_value', { valueAsNumber: true })} type="number" step={discountType === 'percentage' ? '1' : '0.01'} className={inputCls} placeholder={discountType === 'percentage' ? '10' : '200'} />
            {errors.discount_value && <p className={errorCls}>{errors.discount_value.message}</p>}
          </div>
          {discountType === 'percentage' && (
            <div>
              <label className={labelCls}>Max Discount (₹)</label>
              <input {...register('max_discount_amount', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 1000" />
            </div>
          )}
        </div>
      </div>

      {/* Conditions */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-[var(--text-primary)]">Conditions & Limits</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Minimum Order (₹)</label>
            <input {...register('min_order_amount', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 500" />
          </div>
          <div>
            <label className={labelCls}>Total Usage Limit</label>
            <input {...register('usage_limit', { valueAsNumber: true })} type="number" className={inputCls} placeholder="Leave blank for unlimited" />
          </div>
          <div>
            <label className={labelCls}>Per User Limit</label>
            <input {...register('per_user_limit', { valueAsNumber: true })} type="number" className={inputCls} placeholder="e.g. 1" />
          </div>
        </div>
      </div>

      {/* Validity */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-[var(--text-primary)]">Validity Period</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Valid From *</label>
            <input {...register('valid_from')} type="date" className={inputCls} />
            {errors.valid_from && <p className={errorCls}>{errors.valid_from.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Valid Until</label>
            <input {...register('valid_until')} type="date" className={inputCls} />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">Leave blank for no expiry</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-[var(--text-primary)]">Active (coupon is usable)</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : coupon ? 'Save Changes' : 'Create Coupon'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(ROUTES.COUPONS)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
