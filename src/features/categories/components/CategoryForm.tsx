'use client';

import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MediaSection, type MediaSectionHandle } from '@/features/products/components/ProductForm/MediaSection';
import { useCategories, useSaveCategory } from '../hooks/useCategories';
import { FaqEditor } from './FaqEditor';
import { SnippetPreview } from './SnippetPreview';
import {
  GOOGLE_CATEGORY_MAX, GOOGLE_TAXONOMY_URL, SEO_BODY_MAX, SEO_INTRO_MAX,
  buildCategoryPayload, eligibleParents, validateFaqs,
} from '../utils/categoryTree';
import { ROUTES } from '@/lib/constants/routes';
import type { Category } from '@/lib/api/categories';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  image_keys: z.array(z.string()).min(1, 'At least 1 photo is required'),
  video_key: z.string().nullable().optional(),
  parent_id: z.string(),
  seo_intro: z.string().max(SEO_INTRO_MAX, `Max ${SEO_INTRO_MAX} characters`).optional(),
  seo_body: z.string().max(SEO_BODY_MAX, `Max ${SEO_BODY_MAX} characters`).optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).superRefine((faqs, ctx) => {
    const r = validateFaqs(faqs);
    if (!r.valid) ctx.addIssue({ code: 'custom', message: r.form ?? 'Fix the highlighted FAQs' });
  }),
  google_product_category: z.string().max(GOOGLE_CATEGORY_MAX, `Max ${GOOGLE_CATEGORY_MAX} characters`).optional(),
  noindex: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value?.length ?? 0;
  return (
    <span className={`text-[11px] ${len > max ? 'text-destructive' : 'text-muted-foreground'}`}>
      {len}/{max}
    </span>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';
const labelCls = 'block text-xs font-medium text-foreground mb-1.5';
const errorCls = 'mt-1 text-xs text-destructive';

function extraDefaults(category?: Category) {
  return {
    parent_id: category?.parent_id ?? '',
    seo_intro: category?.seo_intro ?? '',
    seo_body: category?.seo_body ?? '',
    faqs: category?.faqs ?? [],
    google_product_category: category?.google_product_category ?? '',
    noindex: category?.noindex ?? false,
  };
}

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const uid = useId();
  const mutation = useSaveCategory();
  const { data: allCategories } = useCategories();
  const mediaRef = useRef<MediaSectionHandle>(null);
  const hasUserChangedImagesRef = useRef(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting, submitCount } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: category ? {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      is_active: category.is_active,
      meta_title: category.meta_title ?? '',
      meta_description: category.meta_description ?? '',
      ...extraDefaults(category),
      image_keys: category.image_keys,
      video_key: category.video_key,
    } : {
      name: '', slug: '', description: '', is_active: true, meta_title: '', meta_description: '',
      image_keys: [], video_key: null, ...extraDefaults(),
    },
  });

  // Sync form if the category data is refreshed after mount (e.g. after a save
  // invalidates the cache and the query re-fetches in the background).
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        is_active: category.is_active,
        meta_title: category.meta_title ?? '',
        meta_description: category.meta_description ?? '',
        ...extraDefaults(category),
        image_keys: category.image_keys,
        video_key: category.video_key,
      });
    }
  }, [category, reset]);

  const name = watch('name');
  useEffect(() => {
    if (!category) setValue('slug', slugify(name));
  }, [name, setValue, category]);

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({
        id: category?.id,
        data: buildCategoryPayload(values),
      });
      toast.success(category ? 'Category updated' : 'Category created');
      router.push(ROUTES.CATEGORIES);
    } catch (err) {
      toast.error((err as { message?: string } | undefined)?.message || 'Failed to save category');
    }
  }

  const parents = eligibleParents(allCategories ?? [], category?.id);
  const metaTitle = watch('meta_title') ?? '';
  const metaDescription = watch('meta_description') ?? '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div>
        <label htmlFor={`${uid}-name`} className={labelCls}>Name *</label>
        <input id={`${uid}-name`} {...register('name')} className={inputCls} placeholder="e.g. Business Stationery" />
        {errors.name && <p className={errorCls}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor={`${uid}-slug`} className={labelCls}>Slug *</label>
        <input id={`${uid}-slug`} {...register('slug')} className={inputCls} />
        {errors.slug && <p className={errorCls}>{errors.slug.message}</p>}
        {category && watch('slug') !== category.slug && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400" role="alert" data-testid="slug-warning">
            Changing the slug changes this category&apos;s URL (/products/{category.slug} becomes /products/{watch('slug') || '…'}). Existing links and search rankings will break.
          </p>
        )}
      </div>

      <div data-field="parent_id">
        <label htmlFor="category-parent" className={labelCls}>Parent category</label>
        <select
          id="category-parent"
          value={watch('parent_id')}
          onChange={(e) => setValue('parent_id', e.target.value, { shouldDirty: true })}
          disabled={parents.disabled}
          className={inputCls}
        >
          <option value="">None (top-level)</option>
          {parents.options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {parents.reason ?? 'Only top-level categories can be parents (two levels maximum).'}
        </p>
      </div>

      <div>
        <label htmlFor={`${uid}-description`} className={labelCls}>Description</label>
        <textarea id={`${uid}-description`} {...register('description')} rows={3} className={inputCls} placeholder="Brief description of this category…" />
      </div>

      {/* Images & Video */}
      <div className="pt-2 border-t border-border space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Images & Video</p>
        <MediaSection
          ref={mediaRef}
          context="category"
          minImages={1}
          maxImages={4}
          videoLabel="Category Video"
          initialImages={category?.images}
          initialVideoKey={category?.video_key}
          initialVideoUrl={category?.video_url}
          initialVideoThumbnailUrl={category?.video_thumbnail_url}
          onImagesChange={(keys) => {
            // MediaSection's own effect fires once on mount with the initial
            // image set (even if nothing changed), not just on real
            // uploads/removals — validating/dirtying on that first call would
            // show "At least 1 photo is required" immediately on a fresh
            // create form, before the admin has done anything. Only the
            // second-and-later calls (a real add/remove) should validate.
            const isRealUserChange = hasUserChangedImagesRef.current;
            hasUserChangedImagesRef.current = true;
            setValue('image_keys', keys, { shouldDirty: isRealUserChange, shouldValidate: isRealUserChange });
          }}
          onVideoChange={(key) => setValue('video_key', key, { shouldDirty: true })}
        />
        {errors.image_keys && <p className={errorCls}>{errors.image_keys.message}</p>}
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-foreground">Active (visible on site)</span>
      </label>

      {/* SEO */}
      <div className="pt-2 border-t border-border space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO — optional</p>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${uid}-meta-title`} className={labelCls.replace('mb-1.5', '')}>Meta Title</label>
            <CharCount value={metaTitle} max={60} />
          </div>
          <input
            id={`${uid}-meta-title`}
            {...register('meta_title')}
            className={inputCls}
            placeholder={`Leave blank to use "${watch('name') || 'category name'}"`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${uid}-meta-description`} className={labelCls.replace('mb-1.5', '')}>Meta Description</label>
            <CharCount value={metaDescription} max={160} />
          </div>
          <textarea
            id={`${uid}-meta-description`}
            {...register('meta_description')}
            rows={3}
            className={inputCls}
            placeholder="Leave blank to auto-generate from description"
          />
        </div>

        <SnippetPreview
          title={metaTitle || watch('name')}
          description={metaDescription || watch('description') || ''}
          slug={watch('slug')}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${uid}-seo-intro`} className={labelCls.replace('mb-1.5', '')}>Intro text</label>
            <CharCount value={watch('seo_intro') ?? ''} max={SEO_INTRO_MAX} />
          </div>
          <textarea id={`${uid}-seo-intro`} {...register('seo_intro')} rows={3} className={inputCls} placeholder="Short paragraph shown at the top of the category page" />
          {errors.seo_intro && <p className={errorCls}>{errors.seo_intro.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${uid}-seo-body`} className={labelCls.replace('mb-1.5', '')}>Body text</label>
            <CharCount value={watch('seo_body') ?? ''} max={SEO_BODY_MAX} />
          </div>
          <textarea id={`${uid}-seo-body`} {...register('seo_body')} rows={8} className={inputCls} placeholder="Longer descriptive copy shown below the product grid" />
          {errors.seo_body && <p className={errorCls}>{errors.seo_body.message}</p>}
        </div>

        <div>
          <label className={labelCls}>FAQs</label>
          <FaqEditor
            value={watch('faqs')}
            onChange={(next) => setValue('faqs', next, { shouldDirty: true })}
            showErrors={submitCount > 0}
          />
          {errors.faqs && <p className={errorCls}>{errors.faqs.message ?? errors.faqs.root?.message}</p>}
        </div>

        <div>
          <label htmlFor={`${uid}-gpc`} className={labelCls}>Google product category</label>
          <input id={`${uid}-gpc`} {...register('google_product_category')} className={inputCls} placeholder="e.g. Arts & Entertainment > Party & Celebration > Party Supplies" />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Used in the shopping feed. Use a name or numeric ID from{' '}
            <a href={GOOGLE_TAXONOMY_URL} target="_blank" rel="noopener noreferrer" className="underline">Google&apos;s product taxonomy</a>.
          </p>
          {errors.google_product_category && <p className={errorCls}>{errors.google_product_category.message}</p>}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={watch('noindex')} onCheckedChange={(v) => setValue('noindex', v, { shouldDirty: true })} size="sm" />
          <span className="text-sm text-foreground">Hide from search engines (noindex)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : category ? 'Save Changes' : 'Create Category'}
        </Button>
        <Button type="button" variant="outline" onClick={async () => {
          await mediaRef.current?.cleanupNewUploads();
          router.push(ROUTES.CATEGORIES);
        }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
