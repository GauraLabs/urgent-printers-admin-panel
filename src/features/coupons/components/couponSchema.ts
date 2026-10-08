import { z } from 'zod';
import { hasAtMostDecimals } from '@/lib/utils/discount';

// numeric(12,2) holds at most 9,999,999,999.99
export const NUMERIC_12_2_MAX = 9_999_999_999.99;
export const COUPON_OUT_OF_RANGE = 'This value is outside the allowed range. Fix it to save.';
export const INT_MAX = 2_147_483_647;
export const PERCENT_TYPO_THRESHOLD = 50;

const fits = (n: number) => n <= NUMERIC_12_2_MAX && hasAtMostDecimals(n, 2);

export const couponSchema = z.object({
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed'], { error: 'Choose a discount type' }),
  discount_value: z.number({ error: 'Enter a discount value' })
    .positive(`Must be greater than 0. ${COUPON_OUT_OF_RANGE}`)
    .refine(fits, 'Must be at most 9,999,999,999.99 with at most 2 decimal places'),
  min_order_amount: z.number().min(0, `Cannot be negative. ${COUPON_OUT_OF_RANGE}`).refine(fits, 'Must fit 9,999,999,999.99 with at most 2 decimals').optional(),
  max_discount_amount: z.number().positive(`Must be greater than 0 (or leave empty). ${COUPON_OUT_OF_RANGE}`).refine(fits, 'Must fit 9,999,999,999.99 with at most 2 decimals').optional(),
  usage_limit: z.number().int('Must be a whole number').positive('Must be at least 1').max(INT_MAX, COUPON_OUT_OF_RANGE).optional(),
  per_user_limit: z.number().int('Must be a whole number').positive('Must be at least 1').max(INT_MAX, COUPON_OUT_OF_RANGE).optional(),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_until: z.string().optional(),
  is_active: z.boolean(),
  trigger: z.enum(['on_signup', 'on_nth_order', 'on_spend_milestone']).nullable(),
  trigger_n: z.number().int().positive().optional(),
  trigger_amount: z.number().positive().optional(),
  is_personal: z.boolean(),
  applies_to_discounted_items: z.boolean(),
  scope: z.enum(['all', 'specific']),
  applicable_product_ids: z.array(z.string()),
  applicable_category_ids: z.array(z.string()),
}).superRefine((d, ctx) => {
  if (d.scope === 'specific' && d.applicable_product_ids.length === 0 && d.applicable_category_ids.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['scope'], message: 'Pick at least one product or category, or choose All products' });
  }
  if (d.discount_type === 'percentage' && Number.isFinite(d.discount_value) && d.discount_value > 100) {
    ctx.addIssue({ code: 'custom', path: ['discount_value'], message: `A percentage can be at most 100. ${COUPON_OUT_OF_RANGE}` });
  }
  if (d.valid_until && d.valid_from && d.valid_until <= d.valid_from) {
    ctx.addIssue({ code: 'custom', path: ['valid_until'], message: 'Valid until must be after valid from' });
  }
});

export type CouponFormValues = z.infer<typeof couponSchema>;

/** Non-blocking "did you mean 15, not 150?" guard. */
export function getPercentTypoWarning(type: string | undefined, value: number | undefined): string | null {
  if (type !== 'percentage' || value == null || !Number.isFinite(value)) return null;
  if (value > PERCENT_TYPO_THRESHOLD && value <= 100) {
    return `${value}% off is more than half the order. Double-check this is intended.`;
  }
  return null;
}
