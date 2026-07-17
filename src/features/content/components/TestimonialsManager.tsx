'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Plus, Pencil, Trash2, Star, Info, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ActiveBadge } from '@/components/common/StatusBadge';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useTestimonials, useTestimonialMutations } from '../hooks/useContent';
import { usePermissions } from '@/hooks/usePermissions';
import { uploadMedia } from '@/lib/api/media';
import { cn } from '@/lib/utils/cn';
import type { Testimonial } from '@/types';

const schema = z.object({
  customer_name: z.string().min(1, 'Name is required'),
  customer_title: z.string().optional(),
  avatar_url: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  rating: z.number().min(1).max(5),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
  err: 'mt-1 text-xs text-[var(--danger)]',
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={cn('transition-colors', n <= value ? 'text-yellow-400' : 'text-[var(--border)]')}>
          <Star className={cn('h-5 w-5', n <= value && 'fill-yellow-400')} />
        </button>
      ))}
    </div>
  );
}

function TestimonialFormInline({ testimonial, onSave, onCancel, isLoading }: {
  testimonial?: Testimonial; onSave: (v: FormValues) => void; onCancel: () => void; isLoading?: boolean;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: testimonial
      ? { customer_name: testimonial.customer_name, customer_title: testimonial.customer_title ?? '', avatar_url: testimonial.avatar_url ?? '', content: testimonial.content, rating: testimonial.rating, is_active: testimonial.is_active }
      : { rating: 5, is_active: true, avatar_url: '' },
  });

  const avatarUrl = watch('avatar_url');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onAvatarDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploadError(null);
    setUploadProgress(0);
    uploadMedia(file, 'testimonial', setUploadProgress)
      .then((result) => {
        if (result.type === 'image') {
          setValue('avatar_url', result.variants.lg.url, { shouldValidate: true });
        }
      })
      .catch((err: Error) => setUploadError(err.message ?? 'Upload failed'))
      .finally(() => setUploadProgress(null));
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onAvatarDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={cls.label}>Customer Name *</label>
          <input {...register('customer_name')} className={cls.input} placeholder="Rahul Sharma" />
          {errors.customer_name && <p className={cls.err}>{errors.customer_name.message}</p>}
        </div>
        <div>
          <label className={cls.label}>Title / Company</label>
          <input {...register('customer_title')} className={cls.input} placeholder="Marketing Manager" />
        </div>
      </div>
      <div>
        <label className={cls.label}>Avatar (optional)</label>
        <div className="flex items-start gap-3">
          <div
            {...getRootProps()}
            className={cn(
              'h-14 w-14 flex-shrink-0 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden',
              isDragActive ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
            )}
          >
            <input {...getInputProps()} />
            {uploadProgress !== null ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <Upload className="h-4 w-4 text-[var(--text-muted)]" />
            )}
          </div>
          <div className="flex-1">
            <input {...register('avatar_url')} className={cls.input} placeholder="https://… (or drop image)" />
            {uploadError && <p className={cls.err}>{uploadError}</p>}
            {errors.avatar_url && <p className={cls.err}>{errors.avatar_url.message}</p>}
          </div>
        </div>
      </div>
      <div>
        <label className={cls.label}>Content *</label>
        <textarea {...register('content')} rows={3} className={cls.input} placeholder="Great prints, fast delivery…" />
        {errors.content && <p className={cls.err}>{errors.content.message}</p>}
      </div>
      <div className="flex items-center gap-6">
        <div>
          <label className={cls.label}>Rating</label>
          <StarRating value={watch('rating') ?? 5} onChange={(v) => setValue('rating', v)} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
          <span className="text-xs text-[var(--text-primary)]">Active</span>
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? 'Saving…' : testimonial ? 'Save' : 'Create'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function TestimonialsManager() {
  const { canManageContent } = usePermissions();
  const { data: testimonials, isLoading } = useTestimonials();
  const { create, update, remove } = useTestimonialMutations();
  const [editing, setEditing] = useState<Testimonial | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  async function handleSave(values: FormValues) {
    try {
      if (editing === 'new') {
        await create.mutateAsync(values);
        toast.success('Testimonial created');
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, d: values });
        toast.success('Testimonial updated');
      }
      setEditing(null);
    } catch { toast.error('Failed to save'); }
  }

  if (isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-3">
      {!canManageContent && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Content. The &ldquo;Manage Content&rdquo; permission is required to add, edit, or delete testimonials.</p>
        </div>
      )}

      {testimonials?.map((t) => (
        editing !== 'new' && editing && editing.id === t.id && canManageContent ? (
          <TestimonialFormInline key={t.id} testimonial={t} onSave={handleSave} onCancel={() => setEditing(null)} isLoading={update.isPending} />
        ) : (
          <div key={t.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--sidebar-active)] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden">
              {t.avatar_url ? (
                <img src={t.avatar_url} alt={t.customer_name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                t.customer_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t.customer_name}</p>
                {t.customer_title && <p className="text-xs text-[var(--text-muted)]">· {t.customer_title}</p>}
                <div className="flex gap-0.5 ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('h-3 w-3', i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--border)]')} />
                  ))}
                </div>
                <ActiveBadge active={t.is_active} className="ml-auto" />
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{t.content}</p>
            </div>
            {canManageContent && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditing(t)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )
      ))}

      {editing === 'new' && canManageContent && (
        <TestimonialFormInline onSave={handleSave} onCancel={() => setEditing(null)} isLoading={create.isPending} />
      )}

      {editing !== 'new' && canManageContent && (
        <Button variant="outline" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add Testimonial
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete testimonial from "${deleteTarget?.customer_name}"?`}
        description="This will permanently remove this testimonial from the site."
        confirmLabel="Delete"
        onConfirm={async () => {
          try { await remove.mutateAsync(deleteTarget!.id); toast.success('Deleted'); setDeleteTarget(null); }
          catch { toast.error('Failed'); }
        }}
        isLoading={remove.isPending}
        variant="danger"
      />
    </div>
  );
}
