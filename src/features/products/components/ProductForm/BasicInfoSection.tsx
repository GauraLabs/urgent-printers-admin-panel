'use client';

import { useEffect, useId, useRef } from 'react';
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

interface Props {
  form: UseFormReturn<ProductFormValues>;
  /** 'edit' means an existing product's `name`/`slug` are already loaded — never auto-derive over a stored slug. */
  mode: 'create' | 'edit';
}

export function BasicInfoSection({ form, mode }: Props) {
  const { register, watch, setValue, formState: { errors, dirtyFields } } = form;
  const { data: categories } = useCategories();
  const name = watch('name');
  const uid = useId();
  const nameId = `${uid}-name`;
  const slugId = `${uid}-slug`;
  const shortDescriptionId = `${uid}-short-description`;
  const categoryId = `${uid}-category`;
  const badgeId = `${uid}-badge`;
  const tagsId = `${uid}-tags`;
  const featuredLabelId = `${uid}-featured-label`;
  const activeLabelId = `${uid}-active-label`;
  // Once the admin types directly into Slug, auto-derivation stops for the
  // rest of this session — a hand-written slug must never be clobbered by a
  // later Name keystroke. Only relevant in create mode; edit mode never
  // auto-derives at all (see effect below).
  const slugTouchedRef = useRef(false);
  const slugField = register('slug');

  useEffect(() => {
    if (mode !== 'create' || slugTouchedRef.current) return;
    if (name) setValue('slug', slugify(name), { shouldDirty: false });
  }, [mode, name, setValue]);

  const fieldClass = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
  const labelClass = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';
  const errorClass = 'mt-1 text-xs text-[var(--danger)]';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={nameId} className={labelClass}>Product Name *</label>
          <input id={nameId} {...register('name')} className={fieldClass} placeholder="e.g. Business Cards Premium" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor={slugId} className={labelClass}>Slug *</label>
          <input
            id={slugId}
            {...slugField}
            onChange={(e) => {
              slugTouchedRef.current = true;
              slugField.onChange(e);
            }}
            className={fieldClass}
            placeholder="auto-generated"
          />
          {errors.slug && <p className={errorClass}>{errors.slug.message}</p>}
          {mode === 'edit' && dirtyFields.name && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Renaming doesn&apos;t change the slug automatically — edit it here if the storefront URL should change too.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={shortDescriptionId} className={labelClass}>Short Description *</label>
        <input id={shortDescriptionId} {...register('short_description')} className={fieldClass} placeholder="Brief one-line description" />
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
          <label htmlFor={categoryId} className={labelClass}>Category *</label>
          {/* Controlled (not register()'d) on purpose: register() applies a
              native <select>'s value once, at ref-attach time. On a cold
              reload, useProductDetail and useCategories race — if the
              matching <option> for the saved category_id doesn't exist yet
              when the ref attaches, the browser falls back to the blank
              placeholder and nothing ever revisits that decision once the
              real options arrive, even though the underlying value is fine.
              Driving it off watch()/setValue() instead re-applies the
              selection on every render, so it self-corrects whichever of
              the two queries resolves last. */}
          <select
            id={categoryId}
            name="category_id"
            value={watch('category_id') ?? ''}
            onChange={(e) => setValue('category_id', e.target.value, { shouldDirty: true })}
            className={fieldClass}
          >
            <option value="">Select category</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.category_id && <p className={errorClass}>{errors.category_id.message}</p>}
        </div>
        <div>
          <label htmlFor={badgeId} className={labelClass}>Badge</label>
          <select id={badgeId} {...register('badge')} className={fieldClass}>
            {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={tagsId} className={labelClass}>Tags (comma-separated)</label>
          <input
            id={tagsId}
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
            aria-labelledby={featuredLabelId}
          />
          <span id={featuredLabelId} className="text-sm text-[var(--text-primary)]">Featured product</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Switch
            checked={watch('status') === 'active'}
            onCheckedChange={(v) => setValue('status', v ? 'active' : 'draft', { shouldDirty: true })}
            size="sm"
            aria-labelledby={activeLabelId}
          />
          <span id={activeLabelId} className="text-sm text-[var(--text-primary)]">Active (visible on site)</span>
        </label>
      </div>
    </div>
  );
}
