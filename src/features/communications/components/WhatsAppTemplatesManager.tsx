'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Pencil, RefreshCw, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import {
  useWhatsAppTemplates,
  useUpdateWhatsAppTemplate,
  useDeleteWhatsAppTemplate,
  useSyncWhatsAppTemplates,
} from '../hooks/useCommunications';
import { WhatsAppTemplateCreateForm } from './WhatsAppTemplateCreateForm';
import { WhatsAppMessagePreview } from './WhatsAppMessagePreview';
import type { WhatsAppTemplate } from '@/types';
import type { BadgeVariant } from '@/components/common/StatusBadge';

const STATUS_VARIANT: Record<WhatsAppTemplate['meta_template_status'], BadgeVariant> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'danger',
};

const CATEGORY_VARIANT: Record<WhatsAppTemplate['category'], BadgeVariant> = {
  utility:        'info',
  marketing:      'purple',
  authentication: 'warning',
};

const editSchema = z.object({
  language_code:        z.string().min(1, 'Language code is required'),
  meta_template_status: z.enum(['pending', 'approved', 'rejected']),
  variable_schema_raw:  z.string(),
  version:              z.number().int().min(1),
  is_active:            z.boolean(),
});
type EditFormValues = z.infer<typeof editSchema>;

const inputCls =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

const selectCls =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

function parseVariables(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function EditForm({
  template,
  onClose,
}: {
  template: WhatsAppTemplate;
  onClose: () => void;
}) {
  const mutation = useUpdateWhatsAppTemplate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      language_code:        template.language_code,
      meta_template_status: template.meta_template_status,
      variable_schema_raw:  template.variable_schema.join(', '),
      version:              template.version,
      is_active:            template.is_active,
    },
  });

  async function onSubmit(values: EditFormValues) {
    try {
      await mutation.mutateAsync({
        id: template.id,
        data: {
          language_code:        values.language_code,
          meta_template_status: values.meta_template_status,
          variable_schema:      parseVariables(values.variable_schema_raw),
          version:              values.version,
          is_active:            values.is_active,
        },
      });
      toast.success('Template updated');
      onClose();
    } catch {
      toast.error('Failed to update template');
    }
  }

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg p-3 bg-muted/10">
        {template.components.length > 0 ? (
          <WhatsAppMessagePreview components={template.components} />
        ) : (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Sync from Meta to load preview.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Language Code</label>
            <input {...register('language_code')} className={inputCls} />
            {errors.language_code && <p className="mt-1 text-xs text-destructive">{errors.language_code.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Meta Status</label>
            <select {...register('meta_template_status')} className={selectCls}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Version</label>
            <input {...register('version', { valueAsNumber: true })} type="number" min={1} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Variables (comma-separated)</label>
          <input {...register('variable_schema_raw')} className={inputCls} />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
          <span className="text-sm text-foreground">Active</span>
        </label>
        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export function WhatsAppTemplatesManager() {
  const { data, isLoading } = useWhatsAppTemplates();
  const deleteMutation = useDeleteWhatsAppTemplate();
  const syncMutation = useSyncWhatsAppTemplates();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Template deleted');
      setConfirmDelete(null);
    } catch {
      toast.error('Failed to delete template');
    }
  }

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const templates = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync from Meta'}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setShowCreate((prev) => !prev);
            setEditing(null);
          }}
        >
          {showCreate ? 'Cancel' : 'Add Template'}
        </Button>
      </div>

      {showCreate && (
        <WhatsAppTemplateCreateForm onClose={() => setShowCreate(false)} />
      )}

      {templates.length === 0 && !showCreate && (
        <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
          No WhatsApp templates yet. Sync from Meta or click &quot;Add Template&quot; to create one.
        </div>
      )}

      {templates.map((tmpl) => (
        <div key={tmpl.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] font-semibold text-foreground">{tmpl.name}</p>
                <Badge
                  label={tmpl.category.charAt(0).toUpperCase() + tmpl.category.slice(1)}
                  variant={CATEGORY_VARIANT[tmpl.category]}
                  dot={false}
                />
                <Badge
                  label={tmpl.meta_template_status.charAt(0).toUpperCase() + tmpl.meta_template_status.slice(1)}
                  variant={STATUS_VARIANT[tmpl.meta_template_status]}
                  dot
                />
                <Badge
                  label={tmpl.is_active ? 'Active' : 'Inactive'}
                  variant={tmpl.is_active ? 'success' : 'default'}
                  dot
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {tmpl.language_code} · v{tmpl.version}
              </p>
              {tmpl.variable_schema.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {tmpl.variable_schema.map((v) => (
                    <code
                      key={v}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-muted-foreground"
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  setEditing(editing === tmpl.id ? null : tmpl.id);
                  setShowCreate(false);
                  setConfirmDelete(null);
                }}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {confirmDelete === tmpl.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    disabled={deleteMutation.isPending}
                    className="px-2 py-1 text-[11px] rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 py-1 text-[11px] rounded border border-border text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(tmpl.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {editing === tmpl.id && (
            <div className="px-4 pb-4">
              <EditForm template={tmpl} onClose={() => setEditing(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
