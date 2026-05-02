'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, Mail, MessageSquare, Bell, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useTemplates, useUpdateTemplate } from '../hooks/useCommunications';
import type { NotificationTemplate } from '@/types';

const schema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const TYPE_ICON = { email: Mail, sms: MessageSquare, push: Bell };
const TYPE_VARIANT: Record<string, 'info' | 'success' | 'warning'> = { email: 'info', sms: 'success', push: 'warning' };

function TemplateEditor({ template, onClose }: { template: NotificationTemplate; onClose: () => void }) {
  const mutation = useUpdateTemplate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subject: template.subject ?? '', body: template.body, is_active: template.is_active },
  });

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({ id: template.id, data: values });
      toast.success('Template updated');
      onClose();
    } catch { toast.error('Failed to update template'); }
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
      {template.type === 'email' && (
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Subject</label>
          <input {...register('subject')} className={inputCls} placeholder="Email subject" />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-foreground mb-1.5">Body</label>
        <textarea {...register('body')} rows={5} className={`${inputCls} resize-none font-mono text-xs`} />
        {errors.body && <p className="mt-1 text-xs text-destructive">{errors.body.message}</p>}
        {template.available_variables.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {template.available_variables.map((v) => (
              <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-muted-foreground">
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        )}
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
        <span className="text-sm text-foreground">Active</span>
      </label>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save'}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

export function TemplatesManager() {
  const { data: templates, isLoading } = useTemplates();
  const [editing, setEditing] = useState<string | null>(null);

  if (isLoading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-3">
      {templates?.map((tmpl) => {
        const Icon = TYPE_ICON[tmpl.type] ?? Mail;
        return (
          <div key={tmpl.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-foreground">{tmpl.name}</p>
                  <Badge label={tmpl.type.toUpperCase()} variant={TYPE_VARIANT[tmpl.type] ?? 'default'} dot={false} />
                  <Badge label={tmpl.is_active ? 'Active' : 'Inactive'} variant={tmpl.is_active ? 'success' : 'default'} dot />
                </div>
                {tmpl.subject && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{tmpl.subject}</p>}
              </div>
              <button
                onClick={() => setEditing(editing === tmpl.id ? null : tmpl.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {editing === tmpl.id && (
              <div className="px-4 pb-4">
                <TemplateEditor template={tmpl} onClose={() => setEditing(null)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
