'use client';

import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import type { ProductFormValues } from './index';

const BADGES = [
  { value: 'none',       label: 'None' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'new',        label: 'New' },
  { value: 'sale',       label: 'Sale' },
  { value: 'popular',    label: 'Popular' },
];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface Props { form: UseFormReturn<ProductFormValues> }

export function BasicInfoSection({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const { data: categories } = useCategories();
  const name = watch('name');

  useEffect(() => {
    if (name) setValue('slug', slugify(name), { shouldDirty: false });
  }, [name, setValue]);

  const fieldClass = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
  const labelClass = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';
  const errorClass = 'mt-1 text-xs text-[var(--danger)]';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Product Name *</label>
          <input {...register('name')} className={fieldClass} placeholder="e.g. Business Cards Premium" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input {...register('slug')} className={fieldClass} placeholder="auto-generated" />
          {errors.slug && <p className={errorClass}>{errors.slug.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Short Description *</label>
        <input {...register('short_description')} className={fieldClass} placeholder="Brief one-line description" />
        {errors.short_description && <p className={errorClass}>{errors.short_description.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Full Description</label>
        <RichTextEditor
          defaultValue={form.getValues('description') ?? ''}
          onChange={(v) => setValue('description', v, { shouldDirty: true })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Category *</label>
          <select {...register('category_id')} className={fieldClass}>
            <option value="">Select category</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className={errorClass}>{errors.category_id.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Badge</label>
          <select {...register('badge')} className={fieldClass}>
            {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            className={fieldClass}
            placeholder="printing, business, premium"
            value={watch('tags')?.join(', ') ?? ''}
            onChange={(e) => setValue('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Switch
            checked={watch('is_featured') ?? false}
            onCheckedChange={(v) => setValue('is_featured', v, { shouldDirty: true })}
            size="sm"
          />
          <span className="text-sm text-[var(--text-primary)]">Featured product</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Switch
            checked={watch('status') === 'active'}
            onCheckedChange={(v) => setValue('status', v ? 'active' : 'draft', { shouldDirty: true })}
            size="sm"
          />
          <span className="text-sm text-[var(--text-primary)]">Active (visible on site)</span>
        </label>
      </div>
    </div>
  );
}
