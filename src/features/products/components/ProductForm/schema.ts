import { z } from 'zod';
import type { ProductStatus } from '@/types';
import { sameInstant } from '@/lib/utils/istDate';
import { hasAtMostDecimals } from '@/lib/utils/discount';

export const BOUNDS = {
  PRICE_MIN: 0.01,
  PRICE_MAX: 100000,
  MRP_MAX_MULTIPLE: 10,
  QTY_MAX: 1_000_000,
  INT_MAX: 2_147_483_647,
  MULTIPLIER_MIN: 0.01,
  MULTIPLIER_MAX: 100,
  EXTRA_COST_MAX: 100000,
  NAME_MAX: 255,
  SLUG_MAX: 255,
  TYPO_TIER_RATIO: 10,
} as const;

export const OUT_OF_RANGE = 'This value is outside the allowed range. Fix it to save.';

const money = (label: string) =>
  z.number({ error: `${label} must be a number` })
    .min(BOUNDS.PRICE_MIN, `${label} must be at least 0.01. ${OUT_OF_RANGE}`)
    .max(BOUNDS.PRICE_MAX, `${label} must be at most 100000. ${OUT_OF_RANGE}`)
    .refine((n) => hasAtMostDecimals(n, 2), `${label} can have at most 2 decimal places`);

const multiplier = z.number({ error: 'Multiplier must be a number' })
  .min(BOUNDS.MULTIPLIER_MIN, `Multiplier must be at least 0.01. ${OUT_OF_RANGE}`)
  .max(BOUNDS.MULTIPLIER_MAX, `Multiplier must be at most 100. ${OUT_OF_RANGE}`)
  .refine((n) => hasAtMostDecimals(n, 4), 'Multiplier can have at most 4 decimal places');

// Tier keys must all be declared: z.object strips unknown keys and PATCH
// replaces the whole tier list, so a dropped mrp_per_unit silently erases
// the discount on save.
const tierSchema = z.object({
  quantity: z.number({ error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, `Quantity must be at least 1. ${OUT_OF_RANGE}`)
    .max(BOUNDS.QTY_MAX, `Quantity must be at most 1,000,000. ${OUT_OF_RANGE}`),
  price_per_unit: money('Price'),
  mrp_per_unit: money('MRP').nullable().optional(),
  discount_percent: z.number().nullable().optional(),
  discount_per_unit: z.number().nullable().optional(),
  is_best_value: z.boolean(),
}).superRefine((tier, ctx) => {
  if (tier.mrp_per_unit == null) return;
  if (!(tier.price_per_unit > 0)) {
    ctx.addIssue({ code: 'custom', message: 'Set a selling price above 0 before adding an MRP', path: ['mrp_per_unit'] });
    return;
  }
  if (tier.mrp_per_unit < tier.price_per_unit) {
    ctx.addIssue({ code: 'custom', message: 'MRP must be at least the selling price', path: ['mrp_per_unit'] });
  } else if (tier.mrp_per_unit > tier.price_per_unit * BOUNDS.MRP_MAX_MULTIPLE) {
    ctx.addIssue({ code: 'custom', message: 'MRP can be at most 10 times the selling price', path: ['mrp_per_unit'] });
  }
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(BOUNDS.NAME_MAX, 'Name can be at most 255 characters'),
  slug: z.string().min(1, 'Slug is required').max(BOUNDS.SLUG_MAX, 'Slug can be at most 255 characters'),
  short_description: z.string().min(1, 'Short description is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  status: z.string(),
  badge: z.string().optional(),
  is_featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sizes: z.array(z.object({ label: z.string(), width: z.number(), height: z.number(), unit: z.enum(['mm', 'cm', 'in', 'ft']), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: multiplier })).optional(),
  paper_types: z.array(z.object({ label: z.string(), gsm: z.number().nullable(), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: multiplier })).optional(),
  finishes: z.array(z.object({ label: z.string(), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: multiplier })).optional(),
  sides_options: z.array(z.object({ label: z.string(), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: multiplier })).optional(),
  quantity_steps: z.array(z.number().int('Must be a whole number').min(1, 'Must be at least 1').max(BOUNDS.QTY_MAX, 'Must be at most 1,000,000')).optional(),
  pricing_tiers: z.array(tierSchema).min(1, 'At least one pricing tier is required'),
  discount_starts_at: z.string().nullable().optional(),
  discount_ends_at: z.string().nullable().optional(),
  turnaround_options: z.array(z.object({ type: z.string(), days: z.number(), extra_cost: z.number({ error: 'Extra cost must be a number' })
    .min(0, `Extra cost cannot be negative. ${OUT_OF_RANGE}`)
    .max(BOUNDS.EXTRA_COST_MAX, `Extra cost must be at most 100000. ${OUT_OF_RANGE}`), is_active: z.boolean() })).optional(),
  seo: z.object({ title: z.string().nullable().optional(), description: z.string().nullable().optional(), canonical_url: z.string().nullable().optional() }).optional(),
  track_inventory: z.boolean().optional(),
  stock_quantity: z.number().int('Stock must be a whole number').max(BOUNDS.INT_MAX, `Stock is too large. ${OUT_OF_RANGE}`).nullable().optional(),
  low_stock_threshold: z.number().int('Threshold must be a whole number').max(BOUNDS.INT_MAX, `Threshold is too large. ${OUT_OF_RANGE}`).nullable().optional(),
  // Populated by MediaSection callbacks — ordered keys of uploaded images + video
  image_keys: z.array(z.string()).optional(),
  video_key: z.string().nullable().optional(),
  customization_mode: z.enum(['artwork', 'template', 'both', 'none']),
  template_fields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['text', 'email', 'phone', 'multiline', 'url']),
    placeholder: z.string().optional(),
    required: z.boolean(),
    max_length: z.number().optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  const seen = new Map<number, number>();
  data.pricing_tiers.forEach((t, i) => {
    if (!Number.isFinite(t.quantity)) return;
    if (seen.has(t.quantity)) {
      ctx.addIssue({ code: 'custom', message: `Duplicate quantity ${t.quantity} (also tier ${(seen.get(t.quantity) as number) + 1})`, path: ['pricing_tiers', i, 'quantity'] });
    } else {
      seen.set(t.quantity, i);
    }
  });

  const floor = getCheapestUnitPrice(data);
  if (floor != null && floor.price < MIN_UNIT_PRICE_ROUNDED) {
    ctx.addIssue({
      code: 'custom',
      message: 'The cheapest combination of tier price and option multipliers would cost less than ₹0.01 per unit. Raise the lowest tier price or the smallest option multiplier.',
      path: ['pricing_tiers', floor.index, 'price_per_unit'],
    });
  }

  const start = data.discount_starts_at;
  const end = data.discount_ends_at;
  if (start && end && new Date(end).getTime() <= new Date(start).getTime()) {
    ctx.addIssue({ code: 'custom', message: 'Sale end must be after sale start', path: ['discount_ends_at'] });
  }
  if ((start || end) && !data.pricing_tiers.some((t) => t.mrp_per_unit != null)) {
    ctx.addIssue({ code: 'custom', message: 'Add an MRP to at least one pricing tier to use a sale window', path: ['discount_ends_at'] });
  }
  if (!data.track_inventory) return;
  if (data.stock_quantity != null && data.stock_quantity < 0) {
    ctx.addIssue({ code: 'custom', message: 'Stock cannot be negative', path: ['stock_quantity'] });
  }
  if (data.low_stock_threshold != null && data.low_stock_threshold < 0) {
    ctx.addIssue({ code: 'custom', message: 'Threshold cannot be negative', path: ['low_stock_threshold'] });
  }
});

export type ProductFormValues = z.infer<typeof productSchema>;

export interface OriginalDiscountWindow {
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

/** A changed (or new) sale end in the past is rejected by the backend with `discount_window_in_past`; catch it before the round trip. */
export function getWindowEndInPastError(
  values: Pick<ProductFormValues, 'discount_ends_at'>,
  original: OriginalDiscountWindow | undefined,
  now: Date = new Date(),
): string | null {
  const end = values.discount_ends_at;
  if (!end) return null;
  if (original && sameInstant(end, original.discount_ends_at)) return null;
  return new Date(end).getTime() <= now.getTime() ? 'Sale end must be in the future' : null;
}

export function buildProductPayload(
  v: ProductFormValues,
  status: ProductStatus,
  original?: OriginalDiscountWindow,
) {
  const payload = {
    name: v.name,
    slug: v.slug,
    short_description: v.short_description,
    description: v.description ?? null,
    category_id: v.category_id ? Number(v.category_id) : null,
    status,
    badge: v.badge || 'none',
    is_featured: v.is_featured ?? false,
    tags: v.tags ?? [],
    sizes: v.sizes ?? [],
    paper_types: v.paper_types ?? [],
    finishes: v.finishes ?? [],
    sides_options: v.sides_options ?? [],
    quantity_steps: v.quantity_steps ?? [],
    pricing_tiers: sortTiersByQuantity(v.pricing_tiers).map((t) => ({
      quantity: t.quantity,
      price_per_unit: t.price_per_unit,
      mrp_per_unit: t.mrp_per_unit ?? null,
      is_best_value: t.is_best_value,
    })),
    turnaround_options: v.turnaround_options ?? [],
    seo: v.seo ?? { title: null, description: null, canonical_url: null },
    image_keys: v.image_keys ?? [],
    video_key: v.video_key ?? null,
    track_inventory: v.track_inventory ?? false,
    stock_quantity: v.stock_quantity ?? null,
    low_stock_threshold: v.low_stock_threshold ?? null,
    customization_mode: v.customization_mode,
    template_fields: v.template_fields ?? [],
  };

  const start = v.discount_starts_at ?? null;
  const end = v.discount_ends_at ?? null;
  // Absent = unchanged, null = clear (backend PATCH uses model_fields_set). On
  // create there is nothing to leave unchanged, so only send a window that exists.
  const windowKeys: Partial<OriginalDiscountWindow> = {};
  if (!original) {
    if (start) windowKeys.discount_starts_at = start;
    if (end) windowKeys.discount_ends_at = end;
  } else {
    if (!sameInstant(start, original.discount_starts_at)) windowKeys.discount_starts_at = start;
    if (!sameInstant(end, original.discount_ends_at)) windowKeys.discount_ends_at = end;
  }
  return { ...payload, ...windowKeys };
}

export function sortTiersByQuantity<T extends { quantity: number }>(tiers: readonly T[]): T[] {
  return [...tiers].sort((a, b) => a.quantity - b.quantity);
}

export interface TierTypoWarning {
  index: number;
  message: string;
}

/** Non-blocking: flags a tier whose price differs from the neighbouring tier (by quantity order) by more than 10x. */
export function getTierPriceTypoWarnings(
  tiers: ReadonlyArray<{ quantity: number; price_per_unit: number }>,
): TierTypoWarning[] {
  const order = tiers
    .map((t, index) => ({ ...t, index }))
    .filter((t) => Number.isFinite(t.quantity) && t.price_per_unit > 0)
    .sort((a, b) => a.quantity - b.quantity);
  const warnings: TierTypoWarning[] = [];
  for (let k = 1; k < order.length; k++) {
    const prev = order[k - 1];
    const cur = order[k];
    const hi = Math.max(prev.price_per_unit, cur.price_per_unit);
    const lo = Math.min(prev.price_per_unit, cur.price_per_unit);
    if (hi / lo > BOUNDS.TYPO_TIER_RATIO) {
      warnings.push({
        index: cur.index,
        message: `This price is more than 10x different from the neighbouring tier (${prev.price_per_unit}). Check for a typo.`,
      });
    }
  }
  return warnings;
}

/** Flattens react-hook-form's nested error object into `[dotted.path, message]` pairs. */
export function collectFieldErrors(errors: unknown, prefix = ''): Array<{ path: string; message: string }> {
  if (!errors || typeof errors !== 'object') return [];
  const out: Array<{ path: string; message: string }> = [];
  const rec = errors as Record<string, unknown>;
  if (typeof rec.message === 'string' && rec.message && 'type' in rec) out.push({ path: prefix, message: rec.message });
  for (const [k, v] of Object.entries(rec)) {
    if (k === 'ref' || k === 'message' || k === 'type' || k === 'types') continue;
    out.push(...collectFieldErrors(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

export const MIN_UNIT_PRICE_ROUNDED = 0.005;

type MultiplierItem = { price_multiplier: number; is_active?: boolean };

/** Min tier price x smallest active multiplier of each option group; the backend rejects (`product_unpriceable`) when this rounds below 0.01. */
export function getCheapestUnitPrice(data: {
  pricing_tiers: ReadonlyArray<{ price_per_unit: number }>;
  sizes?: readonly MultiplierItem[];
  paper_types?: readonly MultiplierItem[];
  finishes?: readonly MultiplierItem[];
  sides_options?: readonly MultiplierItem[];
}): { price: number; index: number } | null {
  let index = -1;
  let min = Infinity;
  data.pricing_tiers.forEach((t, i) => {
    if (Number.isFinite(t.price_per_unit) && t.price_per_unit > 0 && t.price_per_unit < min) { min = t.price_per_unit; index = i; }
  });
  if (index < 0) return null;
  let price = min;
  for (const group of [data.sizes, data.paper_types, data.finishes, data.sides_options]) {
    const active = (group ?? []).filter((o) => o.is_active !== false && Number.isFinite(o.price_multiplier) && o.price_multiplier > 0);
    if (active.length > 0) price *= Math.min(...active.map((o) => o.price_multiplier));
  }
  return { price, index };
}
