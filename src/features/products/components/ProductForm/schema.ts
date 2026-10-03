import { z } from 'zod';
import type { ProductStatus } from '@/types';
import { sameInstant } from '@/lib/utils/istDate';

// Tier keys must all be declared: z.object strips unknown keys and PATCH
// replaces the whole tier list, so a dropped mrp_per_unit silently erases
// the discount on save.
const tierSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price_per_unit: z.number().min(0, 'Price cannot be negative'),
  mrp_per_unit: z.number().positive('MRP must be greater than 0').nullable().optional(),
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
  }
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  short_description: z.string().min(1, 'Short description is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  status: z.string(),
  badge: z.string().optional(),
  is_featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sizes: z.array(z.object({ label: z.string(), width: z.number(), height: z.number(), unit: z.enum(['mm', 'cm', 'in', 'ft']), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: z.number() })).optional(),
  paper_types: z.array(z.object({ label: z.string(), gsm: z.number().nullable(), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: z.number() })).optional(),
  finishes: z.array(z.object({ label: z.string(), is_active: z.boolean(), is_default: z.boolean(), price_multiplier: z.number() })).optional(),
  sides_options: z.array(z.object({ label: z.string(), is_default: z.boolean(), price_multiplier: z.number() })).optional(),
  quantity_steps: z.array(z.number()).optional(),
  pricing_tiers: z.array(tierSchema).min(1, 'At least one pricing tier is required'),
  discount_starts_at: z.string().nullable().optional(),
  discount_ends_at: z.string().nullable().optional(),
  turnaround_options: z.array(z.object({ type: z.string(), days: z.number(), extra_cost: z.number(), is_active: z.boolean() })).optional(),
  seo: z.object({ title: z.string().nullable().optional(), description: z.string().nullable().optional(), canonical_url: z.string().nullable().optional() }).optional(),
  track_inventory: z.boolean().optional(),
  stock_quantity: z.number().nullable().optional(),
  low_stock_threshold: z.number().nullable().optional(),
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
    pricing_tiers: v.pricing_tiers.map((t) => ({
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
