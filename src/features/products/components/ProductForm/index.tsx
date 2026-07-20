'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MediaSection, type MediaSectionHandle } from './MediaSection';
import { CustomizationSection } from './CustomizationSection';
import { InventorySection } from './InventorySection';
import { BasicInfoSection } from './BasicInfoSection';
import { PrintSpecsSection } from './PrintSpecsSection';
import { PricingSection } from './PricingSection';
import { TurnaroundSection, normaliseTurnaroundOptions } from './TurnaroundSection';
import { SeoSection } from './SeoSection';
import { useSaveProduct, useDeleteProduct } from '../../hooks/useProducts';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import type { ApiError, Product, ProductStatus } from '@/types';

const schema = z.object({
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
  pricing_tiers: z.array(z.object({ quantity: z.number(), price_per_unit: z.number(), is_best_value: z.boolean() })).optional(),
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
});

export type ProductFormValues = z.infer<typeof schema>;

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-secondary)] transition-colors">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const saveMutation = useSaveProduct();
  const deleteMutation = useDeleteProduct();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const mediaRef = useRef<MediaSectionHandle>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      slug: product.slug,
      short_description: product.short_description ?? '',
      description: product.description ?? '',
      category_id: product.category_id ?? '',
      status: product.status,
      badge: product.badge ?? 'none',
      is_featured: product.is_featured,
      tags: product.tags,
      sizes: product.sizes,
      paper_types: product.paper_types,
      finishes: product.finishes,
      sides_options: product.sides_options,
      quantity_steps: product.quantity_steps,
      pricing_tiers: product.pricing_tiers,
      turnaround_options: normaliseTurnaroundOptions(product.turnaround_options),
      seo: product.seo,
      track_inventory: product.track_inventory,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      image_keys: product.image_keys,
      video_key: product.video_key,
      customization_mode: product.customization_mode,
      template_fields: product.template_fields,
    } : {
      status: 'draft',
      badge: 'none',
      is_featured: false,
      tags: ['printing', 'business', 'premium', 'fast-delivery'],
      sizes: [
        { label: '90 × 54 mm (Standard)', width: 90,  height: 54, unit: 'mm' as const, is_active: true, is_default: true,  price_multiplier: 1.0 },
        { label: '85 × 55 mm (Euro)',     width: 85,  height: 55, unit: 'mm' as const, is_active: true, is_default: false, price_multiplier: 1.0 },
        { label: '100 × 60 mm (Large)',   width: 100, height: 60, unit: 'mm' as const, is_active: true, is_default: false, price_multiplier: 1.1 },
      ],
      paper_types: [
        { label: '300 GSM Art Board',     gsm: 300, is_active: true, is_default: true,  price_multiplier: 1.0  },
        { label: '350 GSM Art Board',     gsm: 350, is_active: true, is_default: false, price_multiplier: 1.1  },
        { label: '400 GSM Premium Board', gsm: 400, is_active: true, is_default: false, price_multiplier: 1.25 },
        { label: '450 GSM Ultra Thick',   gsm: 450, is_active: true, is_default: false, price_multiplier: 1.4  },
      ],
      finishes: [
        { label: 'Gloss Lamination', is_active: true, is_default: true,  price_multiplier: 1.0  },
        { label: 'Matte Lamination', is_active: true, is_default: false, price_multiplier: 1.05 },
        { label: 'Soft Touch Matte', is_active: true, is_default: false, price_multiplier: 1.15 },
        { label: 'Spot UV',          is_active: true, is_default: false, price_multiplier: 1.3  },
      ],
      sides_options: [
        { label: 'Single Sided', is_default: true,  price_multiplier: 1.0  },
        { label: 'Double Sided', is_default: false, price_multiplier: 1.35 },
      ],
      quantity_steps: [100, 250, 500, 1000, 2500, 5000],
      pricing_tiers: [
        { quantity: 100,  price_per_unit: 12.00, is_best_value: false },
        { quantity: 250,  price_per_unit: 9.00,  is_best_value: false },
        { quantity: 500,  price_per_unit: 7.00,  is_best_value: true  },
        { quantity: 1000, price_per_unit: 5.50,  is_best_value: false },
        { quantity: 2500, price_per_unit: 4.20,  is_best_value: false },
      ],
      turnaround_options: [
        { type: 'standard', days: 5, extra_cost: 0,   is_active: true  },
        { type: 'express',  days: 3, extra_cost: 200, is_active: false },
        { type: 'rush',     days: 1, extra_cost: 500, is_active: false },
      ],
      seo: { title: null, description: null, canonical_url: null },
      track_inventory: false,
      stock_quantity: null,
      low_stock_threshold: null,
      image_keys: [],
      video_key: null,
      customization_mode: 'none' as const,
      template_fields: [],
    },
  });

  const { watch, setValue, formState: { isDirty, isSubmitting } } = form;
  const currentStatus = watch('status') as ProductStatus;

  async function save(status: ProductStatus) {
    const v = form.getValues();

    // Submit buttons call save() directly (not form.handleSubmit), so the Zod
    // schema's validation never runs here — these two fields need an explicit
    // check. The backend now rejects an empty list for both with a 422 (was
    // previously silently accepted), so catch it client-side with a message
    // an admin can act on instead of a raw API failure.
    if ((v.pricing_tiers ?? []).length === 0) {
      toast.error('At least one pricing tier is required');
      return;
    }
    if ((v.turnaround_options ?? []).length === 0) {
      toast.error('At least one turnaround option is required');
      return;
    }

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
      pricing_tiers: v.pricing_tiers ?? [],
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
    try {
      await saveMutation.mutateAsync({ id: product?.id, data: payload });
      toast.success(product ? 'Product updated' : 'Product created');
      if (!product) router.push(ROUTES.PRODUCTS);
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.status === 422 ? apiErr.message : 'Failed to save product');
    }
  }

  async function handleDelete() {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success(`"${product.name}" archived`);
      router.push(ROUTES.PRODUCTS);
    } catch {
      toast.error('Failed to archive product');
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main sections */}
      <div className="xl:col-span-2 space-y-4">
        <Section title="Basic Information">
          <BasicInfoSection form={form} />
        </Section>
        <Section title="Customization">
          <CustomizationSection form={form} />
        </Section>
        <Section title="Images & Video">
          <MediaSection
            ref={mediaRef}
            context="product"
            initialImages={product?.images}
            initialVideoKey={product?.video_key}
            initialVideoUrl={product?.video_url}
            initialVideoThumbnailUrl={product?.video_thumbnail_url}
            onImagesChange={(keys) => setValue('image_keys', keys, { shouldDirty: true })}
            onVideoChange={(key) => setValue('video_key', key, { shouldDirty: true })}
          />
        </Section>
        <Section title="Print Specifications">
          <PrintSpecsSection form={form} />
        </Section>
        <Section title="Pricing Tiers">
          <PricingSection form={form} />
        </Section>
        <Section title="Turnaround Options">
          <TurnaroundSection form={form} />
        </Section>
        <Section title="Inventory" defaultOpen={false}>
          <InventorySection form={form} />
        </Section>
        <Section title="SEO Settings" defaultOpen={false}>
          <SeoSection form={form} />
        </Section>
      </div>

      {/* Sticky sidebar */}
      <div className="xl:col-span-1">
        <div className="xl:sticky xl:top-20 space-y-4">
          {/* Status */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Status</p>
              <p className={cn('text-sm font-semibold capitalize mt-0.5', {
                'text-green-600': currentStatus === 'active',
                'text-orange-600': currentStatus === 'draft',
                'text-[var(--text-muted)]': currentStatus === 'archived',
              })}>
                {currentStatus}
              </p>
            </div>
            {isDirty && <p className="text-[11px] text-[var(--warning)]">Unsaved changes</p>}
          </div>

          {/* Actions */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting || saveMutation.isPending}
              onClick={() => save('active')}
            >
              {product ? 'Save Changes' : 'Publish Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isSubmitting || saveMutation.isPending}
              onClick={() => save('draft')}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={async () => {
                await mediaRef.current?.cleanupNewUploads();
                router.push(ROUTES.PRODUCTS);
              }}
            >
              Cancel
            </Button>
            {product && (
              <>
                <a
                  href={`/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-3 py-1.5 text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
                >
                  Preview ↗
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-md transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Product
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${product?.name}"?`}
        description="This will permanently delete the product. This cannot be undone."
        confirmLabel="Delete Product"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </form>
  );
}
