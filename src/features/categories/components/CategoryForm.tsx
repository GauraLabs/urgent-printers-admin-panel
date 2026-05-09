'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MediaSection, type MediaSectionHandle } from '@/features/products/components/ProductForm/MediaSection';
import { useSaveCategory } from '../hooks/useCategories';
import { ROUTES } from '@/lib/constants/routes';
import type { Category } from '@/lib/api/categories';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  image_keys: z.array(z.string()).optional(),
  video_key: z.string().nullable().optional(),
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

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const mutation = useSaveCategory();
  const mediaRef = useRef<MediaSectionHandle>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: category ? {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      is_active: category.is_active,
      meta_title: category.meta_title ?? '',
      meta_description: category.meta_description ?? '',
      image_keys: category.image_keys,
      video_key: category.video_key,
    } : {
      name: '', slug: '', description: '', is_active: true, meta_title: '', meta_description: '',
      image_keys: [], video_key: null,
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
        data: {
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          is_active: values.is_active,
          meta_title: values.meta_title || null,
          meta_description: values.meta_description || null,
          image_keys: values.image_keys ?? [],
          video_key: values.video_key ?? null,
        },
      });
      toast.success(category ? 'Category updated' : 'Category created');
      router.push(ROUTES.CATEGORIES);
    } catch {
      toast.error('Failed to save category');
    }
  }

  const metaTitle = watch('meta_title') ?? '';
  const metaDescription = watch('meta_description') ?? '';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div>
        <label className={labelCls}>Name *</label>
        <input {...register('name')} className={inputCls} placeholder="e.g. Business Stationery" />
        {errors.name && <p className={errorCls}>{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Slug *</label>
        <input {...register('slug')} className={inputCls} />
        {errors.slug && <p className={errorCls}>{errors.slug.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea {...register('description')} rows={3} className={inputCls} placeholder="Brief description of this category…" />
      </div>

      {/* Images & Video */}
      <div className="pt-2 border-t border-border space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Images & Video — optional</p>
        <MediaSection
          ref={mediaRef}
          context="category"
          maxImages={4}
          videoLabel="Category Video"
          initialImages={category?.images}
          initialVideoKey={category?.video_key}
          initialVideoUrl={category?.video_url}
          initialVideoThumbnailUrl={category?.video_thumbnail_url}
          onImagesChange={(keys) => setValue('image_keys', keys, { shouldDirty: true })}
          onVideoChange={(key) => setValue('video_key', key, { shouldDirty: true })}
        />
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
            <label className={labelCls.replace('mb-1.5', '')}>Meta Title</label>
            <CharCount value={metaTitle} max={60} />
          </div>
          <input
            {...register('meta_title')}
            className={inputCls}
            placeholder={`Leave blank to use "${watch('name') || 'category name'}"`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls.replace('mb-1.5', '')}>Meta Description</label>
            <CharCount value={metaDescription} max={160} />
          </div>
          <textarea
            {...register('meta_description')}
            rows={3}
            className={inputCls}
            placeholder="Leave blank to auto-generate from description"
          />
        </div>
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
