'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Banner } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  image_url: z.string().min(1, 'Image URL is required'),
  link_url: z.string().optional(),
  link_text: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  is_active: z.boolean(),
});
export type BannerFormValues = z.infer<typeof schema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
  err: 'mt-1 text-xs text-[var(--danger)]',
};

interface BannerFormProps {
  banner?: Banner;
  onSubmit: (values: BannerFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BannerForm({ banner, onSubmit, onCancel, isLoading }: BannerFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BannerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: banner ? {
      title: banner.title,
      subtitle: banner.subtitle ?? '',
      image_url: banner.image_url,
      link_url: banner.link_url ?? '',
      link_text: banner.link_text ?? '',
      valid_from: banner.valid_from?.slice(0, 10) ?? '',
      valid_until: banner.valid_until?.slice(0, 10) ?? '',
      is_active: banner.is_active,
    } : { is_active: true },
  });

  const imageUrl = watch('image_url');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Title *</label>
          <input {...register('title')} className={cls.input} placeholder="Premium Business Cards" />
          {errors.title && <p className={cls.err}>{errors.title.message}</p>}
        </div>
        <div>
          <label className={cls.label}>Subtitle</label>
          <input {...register('subtitle')} className={cls.input} placeholder="From ₹499 for 500 cards" />
        </div>
      </div>

      <div>
        <label className={cls.label}>Image URL *</label>
        <input {...register('image_url')} className={cls.input} placeholder="https://…" />
        {errors.image_url && <p className={cls.err}>{errors.image_url.message}</p>}
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-[var(--border)]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Link URL</label>
          <input {...register('link_url')} className={cls.input} placeholder="/products/business-cards" />
        </div>
        <div>
          <label className={cls.label}>Link Button Text</label>
          <input {...register('link_text')} className={cls.input} placeholder="Shop Now" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Valid From</label>
          <input {...register('valid_from')} type="date" className={cls.input} />
        </div>
        <div>
          <label className={cls.label}>Valid Until</label>
          <input {...register('valid_until')} type="date" className={cls.input} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-[var(--text-primary)]">Active</span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? 'Saving…' : banner ? 'Save Changes' : 'Create Banner'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
