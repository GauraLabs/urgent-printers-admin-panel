'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Percent, Undo2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatIst } from '@/lib/utils/istDate';
import {
  useBulkDiscountBatches, useBulkDiscountCommit, useBulkDiscountPreview, useBulkDiscountUndo,
} from '../hooks/useBulkDiscount';
import {
  buildBulkParams, describeSkipReason, validateBulkInput, type BulkInput, type BulkScopeMode,
} from '../utils/bulkDiscount';
import {
  BULK_DISCOUNT_ERROR,
  type ApiError, type BulkDiscountAction, type BulkDiscountPreview, type BulkProductChange,
  type BulkDiscountBatch, type ProductSummary,
} from '@/types';
import type { BulkParams } from '../utils/bulkDiscount';

interface CategoryOption { id: string; name: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAction: BulkDiscountAction;
  selected: ProductSummary[];
  categories: CategoryOption[];
  defaultCategoryId?: string;
}

type Step = 'configure' | 'review' | 'done';

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const labelCls = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';
const errorCls = 'mt-1 text-xs text-[var(--danger)]';

function errorCode(err: unknown): string | undefined {
  return (err as ApiError | undefined)?.code;
}

function errorMessage(err: unknown, fallback: string): string {
  const e = err as ApiError | undefined;
  if (e?.code === BULK_DISCOUNT_ERROR.WINDOW_IN_PAST) return 'Sale end must be in the future';
  if (e?.code === BULK_DISCOUNT_ERROR.WINDOW_REQUIRES_MRP) return 'A sale window needs an MRP on at least one tier';
  if (e?.code === BULK_DISCOUNT_ERROR.SCOPE_TOO_LARGE) return 'Too many products in this scope. Narrow the selection or pick a smaller category (500 products maximum).';
  if (e?.code === BULK_DISCOUNT_ERROR.PRODUCTS_NOT_FOUND) return 'Some of the selected products no longer exist. Refresh the list and try again.';
  return e?.message || fallback;
}

function ProductRow({ p }: { p: BulkProductChange }) {
  return (
    <li className="px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{p.name}</span>
        {p.skipped_reason
          ? <Badge label={`Skipped: ${describeSkipReason(p.skipped_reason)}`} variant="default" dot={false} />
          : p.had_existing_discount && <Badge label="Overwrites existing" variant="warning" dot={false} />}
      </div>
      {!p.skipped_reason && (
        <ul className="mt-1.5 space-y-0.5">
          {p.tiers.map((t) => (
            <li key={t.quantity} className="flex flex-wrap items-center gap-x-2 text-[11px] tabular-nums text-[var(--text-secondary)]">
              <span className="w-14 text-[var(--text-muted)]">Qty {t.quantity}</span>
              {t.skipped_reason ? (
                <span className="text-[var(--text-muted)]">Skipped: {describeSkipReason(t.skipped_reason)}</span>
              ) : (
                <>
                  <span>
                    {t.before.mrp_per_unit != null && <s className="mr-1 text-[var(--text-muted)]">{formatPrice(t.before.mrp_per_unit)}</s>}
                    {formatPrice(t.before.price_per_unit)}
                  </span>
                  <span aria-hidden>&rarr;</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {t.after.mrp_per_unit != null && <s className="mr-1 font-normal text-[var(--text-muted)]">{formatPrice(t.after.mrp_per_unit)}</s>}
                    {formatPrice(t.after.price_per_unit)}
                  </span>
                  {t.discount_percent != null && t.discount_percent >= 1 && (
                    <span className="text-emerald-600 dark:text-emerald-400">{t.discount_percent}% off</span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function BulkDiscountDialog({ open, onOpenChange, initialAction, selected, categories, defaultCategoryId }: Props) {
  const previewMutation = useBulkDiscountPreview();
  const commitMutation = useBulkDiscountCommit();
  const undoMutation = useBulkDiscountUndo();
  const batchesQuery = useBulkDiscountBatches(open);

  const [step, setStep] = useState<Step>('configure');
  const [input, setInput] = useState<BulkInput>({
    action: initialAction,
    scopeMode: selected.length > 0 ? 'selected' : 'category',
    selectedIds: selected.map((p) => p.id),
    categoryId: defaultCategoryId ?? '',
    percent: '',
    startsAtLocal: '',
    endsAtLocal: '',
    overwriteExisting: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<BulkDiscountPreview | null>(null);
  const [staleNotice, setStaleNotice] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  function patch(p: Partial<BulkInput>) {
    setInput((prev) => ({ ...prev, ...p }));
  }

  function handleOpenChange(v: boolean) {
    if (!v && (commitMutation.isPending || previewMutation.isPending)) return;
    onOpenChange(v);
  }

  async function runPreview(params: BulkParams): Promise<BulkDiscountPreview | null> {
    try {
      const res = await previewMutation.mutateAsync(params);
      setPreview(res);
      return res;
    } catch (err) {
      setServerError(errorMessage(err, 'Could not preview the changes'));
      return null;
    }
  }

  async function handlePreview() {
    const v = validateBulkInput(input);
    setErrors(v);
    setServerError(null);
    if (Object.keys(v).length > 0) return;
    setStaleNotice(false);
    const res = await runPreview(buildBulkParams(input));
    if (res) setStep('review');
  }

  async function handleUndo(batchId: string) {
    try {
      const res = await undoMutation.mutateAsync(batchId);
      const skipped = res.summary.skipped;
      toast.success(
        skipped > 0
          ? `Undone: ${res.summary.changed} restored, ${skipped} skipped (edited since)`
          : `Undone: ${res.summary.changed} product${res.summary.changed === 1 ? '' : 's'} restored`,
      );
    } catch (err) {
      if (errorCode(err) === BULK_DISCOUNT_ERROR.ALREADY_UNDONE) {
        toast.info('This batch has already been undone');
        batchesQuery.refetch();
      } else {
        toast.error(errorMessage(err, 'Failed to undo batch'));
      }
    }
  }

  async function handleCommit() {
    if (!preview) return;
    const params = buildBulkParams(input);
    setServerError(null);
    try {
      const res = await commitMutation.mutateAsync({ params, token: preview.preview_token });
      const verb = params.action === 'apply' ? 'Discount applied to' : 'Discount cleared on';
      const msg = `${verb} ${res.summary.changed} product${res.summary.changed === 1 ? '' : 's'}`;
      setLastSummary(msg);
      setStep('done');
      toast.success(msg, {
        duration: 15_000,
        action: { label: 'Undo', onClick: () => { void handleUndo(res.batch_id); } },
      });
    } catch (err) {
      if (errorCode(err) === BULK_DISCOUNT_ERROR.PREVIEW_STALE) {
        setStaleNotice(true);
        await runPreview(params);
        return;
      }
      setServerError(errorMessage(err, 'Failed to apply changes'));
    }
  }

  function reset() {
    setStep('configure');
    setPreview(null);
    setStaleNotice(false);
    setServerError(null);
  }

  const isApply = input.action === 'apply';
  const changed = preview?.summary.changed ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--info-bg)] flex items-center justify-center flex-shrink-0">
              <Percent className="h-4 w-4 text-[var(--info)]" />
            </div>
            <DialogTitle>{isApply ? 'Apply discount' : 'Clear discount'}</DialogTitle>
          </div>
          <DialogDescription>
            {step === 'configure' && 'You will see exactly what changes before anything is saved.'}
            {step === 'review' && 'Review the changes. Nothing is saved until you confirm.'}
            {step === 'done' && (lastSummary ?? 'Done.')}
          </DialogDescription>
        </DialogHeader>

        {step === 'configure' && (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5" role="group" aria-label="Action">
              {(['apply', 'clear'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={input.action === a}
                  onClick={() => patch({ action: a })}
                  className={`px-3 py-1 text-xs rounded-md cursor-pointer ${input.action === a ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)]'}`}
                >
                  {a === 'apply' ? 'Apply discount' : 'Clear discount'}
                </button>
              ))}
            </div>

            <fieldset className="space-y-2">
              <legend className={labelCls}>Scope</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio" name="bulk-scope" checked={input.scopeMode === 'selected'}
                  disabled={selected.length === 0}
                  onChange={() => patch({ scopeMode: 'selected' as BulkScopeMode })}
                />
                Selected products ({selected.length})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio" name="bulk-scope" checked={input.scopeMode === 'category'}
                  onChange={() => patch({ scopeMode: 'category' as BulkScopeMode })}
                />
                Whole category
              </label>
              {input.scopeMode === 'category' && (
                <select
                  aria-label="Category"
                  value={input.categoryId}
                  onChange={(e) => patch({ categoryId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {errors.scope && <p className={errorCls}>{errors.scope}</p>}
            </fieldset>

            {isApply ? (
              <>
                <div>
                  <label htmlFor="bulk-percent" className={labelCls}>Percent off *</label>
                  <input
                    id="bulk-percent" type="number" step="0.01" min="0" max="99.99" className={`${inputCls} max-w-[10rem]`}
                    value={input.percent} onChange={(e) => patch({ percent: e.target.value })} placeholder="e.g. 20"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Applied to each tier&apos;s MRP (or its current price if it has none). Re-applying never compounds.
                  </p>
                  {errors.percent && <p className={errorCls}>{errors.percent}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bulk-starts" className={labelCls}>Sale starts (IST, optional)</label>
                    <input id="bulk-starts" type="datetime-local" className={inputCls} value={input.startsAtLocal} onChange={(e) => patch({ startsAtLocal: e.target.value })} />
                    {errors.starts_at && <p className={errorCls}>{errors.starts_at}</p>}
                  </div>
                  <div>
                    <label htmlFor="bulk-ends" className={labelCls}>Sale ends (IST, optional)</label>
                    <input id="bulk-ends" type="datetime-local" className={inputCls} value={input.endsAtLocal} onChange={(e) => patch({ endsAtLocal: e.target.value })} />
                    {errors.ends_at && <p className={errorCls}>{errors.ends_at}</p>}
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Outside this window, customers pay the MRP. Times are in IST (UTC+05:30).</p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={input.overwriteExisting}
                    onCheckedChange={(v: boolean) => patch({ overwriteExisting: v })}
                  />
                  Overwrite existing discounts
                </label>
              </>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Restores each tier&apos;s price to its MRP, removes the MRP, and clears the sale window.
              </p>
            )}

            {serverError && <p role="alert" className={errorCls}>{serverError}</p>}

            <RecentBatches
              batches={batchesQuery.data}
              isLoading={batchesQuery.isLoading}
              onUndo={handleUndo}
              undoing={undoMutation.isPending}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={handlePreview} disabled={previewMutation.isPending}>
                {previewMutation.isPending ? 'Previewing…' : 'Preview changes'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'review' && preview && (
          <div className="space-y-3">
            {staleNotice && (
              <p role="alert" className="text-xs text-[var(--warning)]">
                Products changed since the last preview. This is the refreshed preview; review it and confirm again.
              </p>
            )}
            <p className="text-xs text-[var(--text-secondary)]" data-testid="bulk-summary">
              {preview.summary.matched} matched, {preview.summary.changed} will change, {preview.summary.skipped} skipped
              {isApply && input.endsAtLocal && ` · sale ends ${formatIst(buildBulkParams(input).ends_at)}`}
            </p>
            <ul className="max-h-[40vh] overflow-y-auto divide-y divide-[var(--border-subtle)] border border-[var(--border)] rounded-lg">
              {preview.products.map((p) => <ProductRow key={p.id} p={p} />)}
            </ul>
            {serverError && <p role="alert" className={errorCls}>{serverError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset} disabled={commitMutation.isPending}>Back</Button>
              <Button type="button" onClick={handleCommit} disabled={changed === 0 || commitMutation.isPending || previewMutation.isPending}>
                {commitMutation.isPending
                  ? 'Applying…'
                  : `${isApply ? 'Apply to' : 'Clear on'} ${changed} product${changed === 1 ? '' : 's'}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <RecentBatches
              batches={batchesQuery.data}
              isLoading={batchesQuery.isLoading}
              onUndo={handleUndo}
              undoing={undoMutation.isPending}
            />
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecentBatches({
  batches, isLoading, onUndo, undoing,
}: {
  batches: BulkDiscountBatch[] | undefined;
  isLoading: boolean;
  onUndo: (id: string) => void;
  undoing: boolean;
}) {
  return (
    <section aria-label="Recent batches">
      <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1.5">Recent batches</h4>
      {isLoading && <p className="text-[11px] text-[var(--text-muted)]">Loading…</p>}
      {!isLoading && (batches?.length ?? 0) === 0 && <p className="text-[11px] text-[var(--text-muted)]">No batches yet.</p>}
      <ul className="divide-y divide-[var(--border-subtle)] border border-[var(--border)] rounded-lg">
        {batches?.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-primary)]">
                {b.action === 'apply' ? `Applied ${b.percent ?? ''}%` : 'Cleared discount'} · {b.scope_summary}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {formatIst(b.created_at)}{b.created_by ? ` · ${b.created_by}` : ''}
              </p>
            </div>
            {b.undone_at ? (
              <Badge label="Undone" variant="default" dot={false} />
            ) : (
              <Button type="button" size="sm" variant="outline" disabled={undoing} onClick={() => onUndo(b.id)} aria-label={`Undo batch ${b.id}`}>
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
