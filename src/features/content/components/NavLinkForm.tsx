'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NavLinkTargetPicker } from './NavLinkTargetPicker';
import { LINK_URL_INVALID_MESSAGE, isValidLinkUrl } from './LinkUrlPicker';
import type { NavLink } from '@/types';

const schema = z
  .object({
    label: z.string().min(1, 'Label is required').max(100, 'Keep it under 100 characters'),
    category_id: z.string().nullable(),
    custom_url: z.string().nullable(),
    is_active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const hasCategory = v.category_id !== null;
    const hasCustomUrl = v.custom_url !== null;
    if (hasCategory === hasCustomUrl) {
      ctx.addIssue({ code: 'custom', message: 'Choose exactly one of Category or Custom URL', path: ['custom_url'] });
      return;
    }
    if (hasCustomUrl && (!v.custom_url || !isValidLinkUrl(v.custom_url))) {
      ctx.addIssue({
        code: 'custom',
        message: v.custom_url ? LINK_URL_INVALID_MESSAGE : 'Custom URL cannot be empty',
        path: ['custom_url'],
      });
    }
  });

export type NavLinkFormValues = z.infer<typeof schema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
  err: 'mt-1 text-xs text-[var(--danger)]',
};

interface NavLinkFormProps {
  navLink?: NavLink;
  onSubmit: (values: NavLinkFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NavLinkForm({ navLink, onSubmit, onCancel, isLoading }: NavLinkFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<NavLinkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: navLink
      ? {
          label: navLink.label,
          category_id: navLink.category_id,
          custom_url: navLink.custom_url,
          is_active: navLink.is_active,
        }
      : { label: '', category_id: null, custom_url: null, is_active: true },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={cls.label}>Label *</label>
        <input {...register('label')} className={cls.input} placeholder="Shop Business Cards" />
        {errors.label && <p className={cls.err}>{errors.label.message}</p>}
      </div>

      <div>
        <label className={cls.label}>Target *</label>
        <NavLinkTargetPicker
          categoryId={watch('category_id')}
          customUrl={watch('custom_url')}
          onChange={({ category_id, custom_url }) => {
            setValue('category_id', category_id, { shouldValidate: true });
            setValue('custom_url', custom_url, { shouldValidate: true });
          }}
          error={errors.custom_url?.message}
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-[var(--text-primary)]">Active</span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? 'Saving…' : navLink ? 'Save Changes' : 'Create Link'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
