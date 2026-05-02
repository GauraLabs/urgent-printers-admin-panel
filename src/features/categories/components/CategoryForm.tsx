'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSaveCategory } from '../hooks/useCategories';
import { ROUTES } from '@/lib/constants/routes';
import type { Category } from '@/lib/api/categories';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const labelCls = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';
const errorCls = 'mt-1 text-xs text-[var(--danger)]';

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const mutation = useSaveCategory();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: category
      ? { name: category.name, slug: category.slug, description: category.description ?? '', is_active: category.is_active }
      : { name: '', slug: '', description: '', is_active: true },
  });

  const name = watch('name');
  useEffect(() => {
    if (!category) setValue('slug', slugify(name));
  }, [name, setValue, category]);

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({ id: category?.id, data: values });
      toast.success(category ? 'Category updated' : 'Category created');
      router.push(ROUTES.CATEGORIES);
    } catch {
      toast.error('Failed to save category');
    }
  }

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
      <label className="flex items-center gap-3 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-[var(--text-primary)]">Active (visible on site)</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : category ? 'Save Changes' : 'Create Category'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(ROUTES.CATEGORIES)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
