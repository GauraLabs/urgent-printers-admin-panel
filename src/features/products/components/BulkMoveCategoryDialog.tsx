'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CategorySelectOptions, selectedCategoryHasChildren } from '@/features/categories/components/CategorySelectOptions';
import { categoryPath } from '@/features/categories/utils/categoryTree';
import { useBulkMoveCategory } from '../hooks/useProducts';
import type { ApiError, ProductSummary } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: ProductSummary[];
  onDone?: () => void;
}

const MAX_BULK_MOVE = 500;

export function moveResultMessage(moved: number, unchanged: number, targetPath: string): string {
  const parts = [`Moved ${moved} product${moved === 1 ? '' : 's'} to ${targetPath}`];
  if (unchanged > 0) parts.push(`${unchanged} already there`);
  return parts.join(' · ');
}

export function BulkMoveCategoryDialog({ open, onOpenChange, selected, onDone }: Props) {
  const { data: categories = [] } = useCategories();
  const mutation = useBulkMoveCategory();
  const [target, setTarget] = useState('');
  const [confirming, setConfirming] = useState(false);

  const targetPath = categoryPath(categories, target);
  const count = selected.length;
  const tooMany = count > MAX_BULK_MOVE;

  async function submit() {
    try {
      const res = await mutation.mutateAsync({ productIds: selected.map((p) => p.id), categoryId: target });
      toast.success(moveResultMessage(res.moved, res.unchanged, targetPath));
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      toast.error((err as ApiError | undefined)?.message || 'Failed to move products');
      setConfirming(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to category</DialogTitle>
          <DialogDescription>
            {confirming
              ? `Move ${count} product${count === 1 ? '' : 's'} to "${targetPath}"?`
              : `Choose the category ${count} selected product${count === 1 ? '' : 's'} will move to.`}
          </DialogDescription>
        </DialogHeader>

        {confirming ? (
          <p className="text-xs text-[var(--text-secondary)]" data-testid="move-confirm">
            Product page URLs change to the new category. Old links redirect once the storefront has refreshed.
          </p>
        ) : (
          <div>
            <label htmlFor="bulk-move-target" className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Target category</label>
            <select
              id="bulk-move-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">Select category</option>
              <CategorySelectOptions categories={categories} />
            </select>
            {selectedCategoryHasChildren(categories, target) && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400" data-testid="parent-category-warning">
                This category has subcategories. Prefer the most specific subcategory.
              </p>
            )}
            {tooMany && <p className="mt-1 text-xs text-[var(--danger)]">Select at most {MAX_BULK_MOVE} products at a time.</p>}
          </div>
        )}

        <DialogFooter>
          {confirming ? (
            <>
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={mutation.isPending}>Back</Button>
              <Button type="button" onClick={submit} disabled={mutation.isPending}>
                {mutation.isPending ? 'Moving…' : `Move ${count} product${count === 1 ? '' : 's'}`}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={() => setConfirming(true)} disabled={!target || count === 0 || tooMany}>Continue</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
