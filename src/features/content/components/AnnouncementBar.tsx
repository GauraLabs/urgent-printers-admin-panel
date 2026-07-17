'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useAnnouncement, useAnnouncementMutation } from '../hooks/useContent';
import { usePermissions } from '@/hooks/usePermissions';
import { LinkUrlPicker, LINK_URL_PATTERN, LINK_URL_INVALID_MESSAGE } from './LinkUrlPicker';

const schema = z.object({
  message: z.string().min(1, 'Message is required'),
  link_url: z.string().optional().refine((v) => !v || LINK_URL_PATTERN.test(v), { message: LINK_URL_INVALID_MESSAGE }),
  link_text: z.string().optional(),
  bg_color: z.string().min(1, 'Background colour is required').regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color (e.g. #3b82f6)'),
  text_color: z.string().min(1, 'Text colour is required').regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color (e.g. #3b82f6)'),
  is_active: z.boolean(),
  countdown_end_at: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
  err: 'mt-1 text-xs text-[var(--danger)]',
};

const TIMER_PLACEHOLDER = '{{timer}}';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatCountdown(target: Date, now: number): string {
  const diffMs = target.getTime() - now;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days >= 1) {
    return `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
  }
  return `${hours}h : ${pad(minutes)}m : ${pad(seconds)}s`;
}

function renderAnnouncementMessage(message: string, countdownEndAt: string | undefined, now: number): string {
  const hasPlaceholder = message.includes(TIMER_PLACEHOLDER);
  if (!hasPlaceholder) return message;

  const target = countdownEndAt ? new Date(countdownEndAt) : null;
  const active = !!target && !Number.isNaN(target.getTime()) && target.getTime() > now;

  if (active && target) {
    return message.replace(TIMER_PLACEHOLDER, formatCountdown(target, now));
  }
  return message.replace(TIMER_PLACEHOLDER, '').replace(/\s{2,}/g, ' ').trim();
}

function isCountdownExpired(message: string, countdownEndAt: string | undefined, now: number): boolean {
  if (!message.includes(TIMER_PLACEHOLDER) || !countdownEndAt) return false;
  const target = new Date(countdownEndAt);
  return !Number.isNaN(target.getTime()) && target.getTime() <= now;
}

export function AnnouncementBar() {
  const { canManageContent } = usePermissions();
  const { data: announcement, isLoading } = useAnnouncement();
  const mutation = useAnnouncementMutation();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
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
        countdown_end_at: announcement.countdown_end_at?.slice(0, 16) ?? '',
      });
    }
  }, [announcement, reset]);

  async function onSubmit(values: FormValues) {
    if (!canManageContent) return;
    try {
      await mutation.mutateAsync({
        ...values,
        countdown_end_at: values.countdown_end_at ? new Date(values.countdown_end_at).toISOString() : null,
      });
      toast.success('Announcement bar updated');
    } catch { toast.error('Failed to save'); }
  }

  const [previewNow, setPreviewNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setPreviewNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <LoadingSkeleton rows={4} className="max-w-xl" />;

  const preview = watch();
  const previewMessage = renderAnnouncementMessage(preview.message || '', preview.countdown_end_at, previewNow);
  const previewHidden = isCountdownExpired(preview.message || '', preview.countdown_end_at, previewNow);

  return (
    <div className="max-w-2xl space-y-6">
      {!canManageContent && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Content. The &ldquo;Manage Content&rdquo; permission is required to edit the announcement bar.</p>
        </div>
      )}

      {/* Live preview */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Preview</p>
        {previewHidden ? (
          <div className="w-full px-4 py-3 text-xs text-center rounded-lg border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            This announcement is hidden on the storefront — its countdown deadline has passed. Update the deadline or edit the message to bring it back.
          </div>
        ) : (
          <div
            className="w-full px-4 py-2 text-sm text-center rounded-lg"
            style={{ backgroundColor: preview.bg_color || '#3b82f6', color: preview.text_color || '#ffffff' }}
          >
            {previewMessage || 'Your announcement message here'}
            {preview.link_url && preview.link_text && (
              <span className="ml-2 underline font-medium">{preview.link_text}</span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={!canManageContent} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={cls.label + ' mb-0'}>Message *</label>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setValue('message', `${watch('message') || ''} ${TIMER_PLACEHOLDER}`, { shouldValidate: true, shouldDirty: true })}
              >
                Insert {TIMER_PLACEHOLDER}
              </Button>
            </div>
            <input {...register('message')} className={cls.input} placeholder="Free shipping on orders above ₹2,000!" />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Tip: include <code>{TIMER_PLACEHOLDER}</code> anywhere in your message to show a live countdown there, e.g. &ldquo;Flash Sale Ends In {TIMER_PLACEHOLDER}&rdquo;. Requires a countdown deadline below — otherwise the placeholder is removed automatically.
            </p>
            {errors.message && <p className={cls.err}>{errors.message.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={cls.label}>Link URL</label>
              <LinkUrlPicker
                value={watch('link_url') ?? ''}
                onChange={(v) => setValue('link_url', v, { shouldValidate: true })}
                error={errors.link_url?.message}
                disabled={!canManageContent}
              />
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
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(watch('bg_color')) ? watch('bg_color') : '#3b82f6'}
                  onChange={(e) => setValue('bg_color', e.target.value, { shouldValidate: true, shouldDirty: true })}
                  className="h-8 w-12 p-0.5 rounded border border-[var(--border)] bg-[var(--surface)] cursor-pointer"
                />
                <input
                  value={watch('bg_color') ?? ''}
                  onChange={(e) => setValue('bg_color', e.target.value, { shouldValidate: true, shouldDirty: true })}
                  className={`${cls.input} flex-1 font-mono text-xs`}
                  placeholder="#3b82f6"
                />
              </div>
              {errors.bg_color && <p className={cls.err}>{errors.bg_color.message}</p>}
            </div>
            <div>
              <label className={cls.label}>Text Colour</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(watch('text_color')) ? watch('text_color') : '#ffffff'}
                  onChange={(e) => setValue('text_color', e.target.value, { shouldValidate: true, shouldDirty: true })}
                  className="h-8 w-12 p-0.5 rounded border border-[var(--border)] bg-[var(--surface)] cursor-pointer"
                />
                <input
                  value={watch('text_color') ?? ''}
                  onChange={(e) => setValue('text_color', e.target.value, { shouldValidate: true, shouldDirty: true })}
                  className={`${cls.input} flex-1 font-mono text-xs`}
                  placeholder="#ffffff"
                />
              </div>
              {errors.text_color && <p className={cls.err}>{errors.text_color.message}</p>}
            </div>
          </div>

          <div>
            <label className={cls.label}>Countdown deadline (optional)</label>
            <input {...register('countdown_end_at')} type="datetime-local" className={cls.input} />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Only shown if you include <code>{TIMER_PLACEHOLDER}</code> in your message above. Leave this blank (or omit <code>{TIMER_PLACEHOLDER}</code>) to skip the timer entirely.
            </p>
            {errors.countdown_end_at && <p className={cls.err}>{errors.countdown_end_at.message}</p>}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <Switch checked={watch('is_active')} disabled={!canManageContent} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
            <span className="text-sm text-[var(--text-primary)]">Show announcement bar on site</span>
          </label>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Announcement'}
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
