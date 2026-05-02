'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ImageUpload } from '@/components/common/ImageUpload';
import { BasicInfoSection } from './BasicInfoSection';
import { PrintSpecsSection } from './PrintSpecsSection';
import { PricingSection } from './PricingSection';
import { TurnaroundSection } from './TurnaroundSection';
import { SeoSection } from './SeoSection';
import { useSaveProduct, useDeleteProduct } from '../../hooks/useProducts';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import type { Product, ProductStatus } from '@/types';

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
  sizes: z.array(z.object({ id: z.string(), label: z.string(), width_mm: z.number(), height_mm: z.number(), is_active: z.boolean() })).optional(),
  paper_types: z.array(z.object({ id: z.string(), label: z.string(), gsm: z.number().nullable(), is_active: z.boolean() })).optional(),
  finishes: z.array(z.object({ id: z.string(), label: z.string(), is_active: z.boolean() })).optional(),
  sides_options: z.array(z.string()).optional(),
  quantity_steps: z.array(z.number()).optional(),
  pricing_tiers: z.array(z.object({ id: z.string(), quantity: z.number(), price_per_unit: z.number(), is_best_value: z.boolean() })).optional(),
  turnaround_options: z.array(z.object({ type: z.string(), days: z.number(), extra_cost: z.number(), is_active: z.boolean() })).optional(),
  seo: z.object({ title: z.string().nullable().optional(), description: z.string().nullable().optional(), canonical_url: z.string().nullable().optional() }).optional(),
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

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      description: product.description,
      category_id: product.category_id,
      status: product.status,
      badge: product.badge ?? '',
      is_featured: product.is_featured,
      tags: product.tags,
      sizes: product.sizes,
      paper_types: product.paper_types,
      finishes: product.finishes,
      sides_options: product.sides_options,
      quantity_steps: product.quantity_steps,
      pricing_tiers: product.pricing_tiers,
      turnaround_options: product.turnaround_options,
      seo: product.seo,
    } : {
      status: 'draft',
      is_featured: false,
      tags: [],
      sizes: [],
      paper_types: [],
      finishes: [],
      sides_options: ['Single Sided', 'Double Sided'],
      quantity_steps: [100, 250, 500, 1000],
      pricing_tiers: [],
      turnaround_options: [
        { type: 'standard', days: 5, extra_cost: 0, is_active: true },
        { type: 'express', days: 3, extra_cost: 200, is_active: true },
        { type: 'rush', days: 1, extra_cost: 500, is_active: true },
      ],
      seo: { title: null, description: null, canonical_url: null },
    },
  });

  const { watch, setValue, formState: { isDirty, isSubmitting } } = form;
  const currentStatus = watch('status') as ProductStatus;

  async function save(status: ProductStatus) {
    const values = form.getValues();
    try {
      await saveMutation.mutateAsync({ id: product?.id, data: { ...values, status } as Partial<Product> });
      toast.success(product ? 'Product updated' : 'Product created');
      if (!product) router.push(ROUTES.PRODUCTS);
    } catch {
      toast.error('Failed to save product');
    }
  }

  async function handleDelete() {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success(`"${product.name}" deleted`);
      router.push(ROUTES.PRODUCTS);
    } catch {
      toast.error('Failed to delete product');
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main sections */}
      <div className="xl:col-span-2 space-y-4">
        <Section title="Basic Information">
          <BasicInfoSection form={form} />
        </Section>
        <Section title="Images">
          <ImageUpload
            maxFiles={8}
            onChange={(files) => {
              /* In real backend, upload files and set image URLs */
            }}
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
