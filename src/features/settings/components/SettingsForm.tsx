'use client';

import { useEffect } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/common/Spinner';

// ── Shared primitives ────────────────────────────────────────────────────────

export const fieldCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

export function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-shrink-0 w-56">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Generic settings form hook ────────────────────────────────────────────────

interface UseSettingsFormProps<T extends FieldValues> {
  data: T | undefined;
  isLoading: boolean;
  onSave: (values: T) => Promise<T>;
}

export function useSettingsForm<T extends FieldValues>({ data, isLoading, onSave }: UseSettingsFormProps<T>) {
  const form = useForm<T>({ defaultValues: data as DefaultValues<T> });

  useEffect(() => {
    if (data) form.reset(data as DefaultValues<T>);
  }, [data]);

  async function handleSave(values: T) {
    try {
      await onSave(values);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
  }

  return { form, handleSave, isLoading };
}

// ── SaveBar ───────────────────────────────────────────────────────────────────
export function SaveBar({ isDirty, isSubmitting }: { isDirty: boolean; isSubmitting: boolean }) {
  if (!isDirty && !isSubmitting) return null;
  return (
    <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-4 px-5 py-3 bg-card border-t border-border shadow-lg rounded-b-xl">
      <p className="text-[13px] text-muted-foreground">You have unsaved changes</p>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? <><Spinner size="sm" className="mr-2" />Saving…</> : 'Save Changes'}
      </Button>
    </div>
  );
}
