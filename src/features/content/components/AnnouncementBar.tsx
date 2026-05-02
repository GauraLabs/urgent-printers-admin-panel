'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useAnnouncement, useAnnouncementMutation } from '../hooks/useContent';

const schema = z.object({
  message: z.string().min(1, 'Message is required'),
  link_url: z.string().optional(),
  link_text: z.string().optional(),
  bg_color: z.string().min(1),
  text_color: z.string().min(1),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
};

export function AnnouncementBar() {
  const { data: announcement, isLoading } = useAnnouncement();
  const mutation = useAnnouncementMutation();

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bg_color: '#3b82f6', text_color: '#ffffff', is_active: false },
  });

  useEffect(() => {
    if (announcement) {
      reset({
        message: announcement.message,
        link_url: announcement.link_url ?? '',
        link_text: announcement.link_text ?? '',
        bg_color: announcement.bg_color,
        text_color: announcement.text_color,
        is_active: announcement.is_active,
      });
    }
  }, [announcement, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync(values);
      toast.success('Announcement bar updated');
    } catch { toast.error('Failed to save'); }
  }

  if (isLoading) return <LoadingSkeleton rows={4} className="max-w-xl" />;

  const preview = watch();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Live preview */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Preview</p>
        <div
          className="w-full px-4 py-2 text-sm text-center rounded-lg"
          style={{ backgroundColor: preview.bg_color || '#3b82f6', color: preview.text_color || '#ffffff' }}
        >
          {preview.message || 'Your announcement message here'}
          {preview.link_url && preview.link_text && (
            <span className="ml-2 underline font-medium">{preview.link_text}</span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={cls.label}>Message *</label>
          <input {...register('message')} className={cls.input} placeholder="Free shipping on orders above ₹2,000!" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Link URL</label>
            <input {...register('link_url')} className={cls.input} placeholder="/products" />
          </div>
          <div>
            <label className={cls.label}>Link Text</label>
            <input {...register('link_text')} className={cls.input} placeholder="Shop Now" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cls.label}>Background Colour</label>
            <div className="flex gap-2 items-center">
              <input type="color" {...register('bg_color')} className="h-8 w-12 p-0.5 rounded border border-[var(--border)] bg-[var(--surface)] cursor-pointer" />
              <input {...register('bg_color')} className={`${cls.input} flex-1 font-mono text-xs`} placeholder="#3b82f6" />
            </div>
          </div>
          <div>
            <label className={cls.label}>Text Colour</label>
            <div className="flex gap-2 items-center">
              <input type="color" {...register('text_color')} className="h-8 w-12 p-0.5 rounded border border-[var(--border)] bg-[var(--surface)] cursor-pointer" />
              <input {...register('text_color')} className={`${cls.input} flex-1 font-mono text-xs`} placeholder="#ffffff" />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
          <span className="text-sm text-[var(--text-primary)]">Show announcement bar on site</span>
        </label>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save Announcement'}
        </Button>
      </form>
    </div>
  );
}
