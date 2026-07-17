'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { cn } from '@/lib/utils/cn';

type TargetMode = 'category' | 'custom';

interface NavLinkTarget {
  category_id: string | null;
  custom_url: string | null;
}

interface NavLinkTargetPickerProps {
  categoryId: string | null;
  customUrl: string | null;
  onChange: (next: NavLinkTarget) => void;
  error?: string;
  disabled?: boolean;
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const errCls = 'mt-1 text-xs text-[var(--danger)]';
const modeBtnBase = 'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors';
const modeBtnActive = 'bg-[var(--primary)] text-white border-[var(--primary)]';
const modeBtnInactive = 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]';

export function NavLinkTargetPicker({ categoryId, customUrl, onChange, error, disabled }: NavLinkTargetPickerProps) {
  const { data: categories } = useCategories();
  const mode: TargetMode = customUrl !== null ? 'custom' : 'category';

  function setMode(next: TargetMode) {
    if (next === mode) return;
    onChange(next === 'category' ? { category_id: null, custom_url: null } : { category_id: null, custom_url: '' });
  }

  return (
    <div>
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMode('category')}
          className={cn(modeBtnBase, mode === 'category' ? modeBtnActive : modeBtnInactive)}
        >
          Category
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMode('custom')}
          className={cn(modeBtnBase, mode === 'custom' ? modeBtnActive : modeBtnInactive)}
        >
          Custom URL
        </button>
      </div>

      {mode === 'category' ? (
        <Select
          value={categoryId ?? ''}
          onValueChange={(v) => onChange({ category_id: (v ?? '') || null, custom_url: null })}
          disabled={disabled}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
          <SelectContent>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <input
          value={customUrl ?? ''}
          onChange={(e) => onChange({ category_id: null, custom_url: e.target.value })}
          disabled={disabled}
          placeholder="https://example.com or /products/business-cards"
          className={inputCls}
        />
      )}

      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}
