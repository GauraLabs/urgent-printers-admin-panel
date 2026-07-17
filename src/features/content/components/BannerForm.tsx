'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { uploadMedia } from '@/lib/api/media';
import { cn } from '@/lib/utils/cn';
import { LinkUrlPicker, LINK_URL_PATTERN, LINK_URL_INVALID_MESSAGE } from './LinkUrlPicker';
import type { Banner } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  badge_text: z.string().max(40, 'Keep it under 40 characters').optional(),
  image_url: z.string().min(1, 'Image URL is required'),
  link_url: z.string().optional().refine((v) => !v || LINK_URL_PATTERN.test(v), { message: LINK_URL_INVALID_MESSAGE }),
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
      badge_text: banner.badge_text ?? '',
      image_url: banner.image_url,
      link_url: banner.link_url ?? '',
      link_text: banner.link_text ?? '',
      valid_from: banner.valid_from?.slice(0, 10) ?? '',
      valid_until: banner.valid_until?.slice(0, 10) ?? '',
      is_active: banner.is_active,
    } : { is_active: true },
  });

  const imageUrl = watch('image_url');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onImageDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);
    uploadMedia(file, 'banner', setUploadProgress)
      .then((result) => {
        if (result.type === 'image') {
          setValue('image_url', result.variants.lg.url, { shouldValidate: true });
        }
      })
      .catch((err: Error) => setUploadError(err.message ?? 'Upload failed'))
      .finally(() => setUploadProgress(null));
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onImageDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
  });

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
        <label className={cls.label}>Badge Text (optional)</label>
        <input {...register('badge_text')} className={cls.input} placeholder="New Arrival" />
        {errors.badge_text && <p className={cls.err}>{errors.badge_text.message}</p>}
      </div>

      <div>
        <label className={cls.label}>Image *</label>
        <p className="text-[11px] text-[var(--text-muted)] mb-2">
          Recommended 1600×500px or larger (~3.2:1 wide) — the storefront hero renders full-bleed up to 520px tall, so smaller or lower-res images will upscale and look soft. JPG, PNG, or WebP. Keep files under ~500KB for fast loading (10MB hard limit).
        </p>
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors mb-2',
            isDragActive ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
          )}
        >
          <input {...getInputProps()} />
          {uploadProgress !== null ? (
            <span className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading {uploadProgress}%
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Upload className="h-3.5 w-3.5" /> {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
            </span>
          )}
        </div>
        {uploadError && <p className={cls.err}>{uploadError}</p>}
        <input {...register('image_url')} className={cls.input} placeholder="https://… (or upload above)" />
        {errors.image_url && <p className={cls.err}>{errors.image_url.message}</p>}
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-[var(--border)]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={cls.label}>Link URL</label>
          <LinkUrlPicker
            value={watch('link_url') ?? ''}
            onChange={(v) => setValue('link_url', v, { shouldValidate: true })}
            error={errors.link_url?.message}
          />
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
