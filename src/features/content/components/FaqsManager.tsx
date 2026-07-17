'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useFaqs, useFaqMutations } from '../hooks/useContent';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils/cn';
import type { Faq } from '@/types';

const schema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  category: z.string().optional(),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const cls = {
  input: 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
  label: 'block text-xs font-medium text-[var(--text-primary)] mb-1.5',
  err: 'mt-1 text-xs text-[var(--danger)]',
};

function FaqFormInline({ faq, onSave, onCancel, isLoading }: {
  faq?: Faq; onSave: (v: FormValues) => void; onCancel: () => void; isLoading?: boolean;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: faq
      ? { question: faq.question, answer: faq.answer, category: faq.category ?? '', is_active: faq.is_active }
      : { is_active: true },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3 p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3">
          <label className={cls.label}>Question *</label>
          <input {...register('question')} className={cls.input} placeholder="What file formats do you accept?" />
          {errors.question && <p className={cls.err}>{errors.question.message}</p>}
        </div>
        <div>
          <label className={cls.label}>Category</label>
          <input {...register('category')} className={cls.input} placeholder="File Requirements" />
        </div>
      </div>
      <div>
        <label className={cls.label}>Answer *</label>
        <textarea {...register('answer')} rows={3} className={cls.input} placeholder="We accept PDF, AI, PSD…" />
        {errors.answer && <p className={cls.err}>{errors.answer.message}</p>}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} size="sm" />
          <span className="text-xs text-[var(--text-primary)]">Active</span>
        </label>
        <div className="flex gap-2 ml-auto">
          <Button type="submit" size="sm" disabled={isLoading}>{isLoading ? 'Saving…' : faq ? 'Save' : 'Create'}</Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}

export function FaqsManager() {
  const { canManageContent } = usePermissions();
  const { data: faqs, isLoading } = useFaqs();
  const { create, update, remove, reorder } = useFaqMutations();
  const [editing, setEditing] = useState<Faq | 'new' | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  const allIds = faqs?.map((f) => f.id) ?? [];

  async function move(id: string, dir: 'up' | 'down') {
    if (!canManageContent || !faqs) return;
    const idx = allIds.indexOf(id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === allIds.length - 1) return;
    const next = [...allIds];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    try { await reorder.mutateAsync(next); } catch { toast.error('Reorder failed'); }
  }

  async function handleSave(values: FormValues) {
    try {
      if (editing === 'new') {
        await create.mutateAsync(values);
        toast.success('FAQ created');
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, d: values });
        toast.success('FAQ updated');
      }
      setEditing(null);
    } catch { toast.error('Failed to save FAQ'); }
  }

  // Group by category
  const grouped = faqs?.reduce<Record<string, Faq[]>>((acc, faq) => {
    const cat = faq.category ?? 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {}) ?? {};

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-4">
      {!canManageContent && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Content. The &ldquo;Manage Content&rdquo; permission is required to add, edit, delete, or reorder FAQs.</p>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{category}</p>
          <div className="space-y-2">
            {items.map((faq) => (
              editing !== 'new' && editing && editing.id === faq.id && canManageContent ? (
                <FaqFormInline key={faq.id} faq={faq} onSave={handleSave} onCancel={() => setEditing(null)} isLoading={update.isPending} />
              ) : (
                <div key={faq.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3">
                    {canManageContent && (
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => move(faq.id, 'up')}
                          disabled={allIds.indexOf(faq.id) === 0}
                          className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => move(faq.id, 'down')}
                          disabled={allIds.indexOf(faq.id) === allIds.length - 1}
                          className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {expanded === faq.id
                        ? <ChevronDown className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                        : <ChevronRight className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />}
                      <span className="text-sm font-medium text-[var(--text-primary)]">{faq.question}</span>
                    </button>
                    {!faq.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border text-[var(--text-muted)] bg-[var(--surface-secondary)] border-[var(--border)] flex-shrink-0">
                        Inactive
                      </span>
                    )}
                    {canManageContent && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditing(faq)} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(faq)} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {expanded === faq.id && (
                    <div className="px-10 pb-3">
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </div>
      ))}

      {editing === 'new' && canManageContent && (
        <FaqFormInline onSave={handleSave} onCancel={() => setEditing(null)} isLoading={create.isPending} />
      )}

      {editing !== 'new' && canManageContent && (
        <Button variant="outline" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this FAQ?"
        description={`"${deleteTarget?.question ?? ''}"`}
        confirmLabel="Delete FAQ"
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
