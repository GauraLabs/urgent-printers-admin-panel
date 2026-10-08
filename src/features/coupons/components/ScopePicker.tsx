'use client';

import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getProducts, getProduct } from '@/lib/api/products';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { couponScopeSummary, SCOPE_HELP } from './couponScope';

interface Props {
  scope: 'all' | 'specific';
  productIds: string[];
  categoryIds: string[];
  onScope: (s: 'all' | 'specific') => void;
  onProducts: (ids: string[]) => void;
  onCategories: (ids: string[]) => void;
}

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-[var(--text-primary)]">
      {label}
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function ScopePicker({ scope, productIds, categoryIds, onScope, onProducts, onCategories }: Props) {
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [picked, setPicked] = useState<Record<string, string>>({});
  const specific = scope === 'specific';

  const search = productSearch.trim();
  const results = useQuery({
    queryKey: ['coupon-scope-products', search],
    queryFn: () => getProducts({ q: search, page_size: 8 }),
    enabled: specific && search.length >= 2,
    staleTime: 30_000,
  });
  const unknown = productIds.filter((id) => !picked[id]);
  const lookups = useQueries({
    queries: unknown.map((id) => ({ queryKey: ['product', id], queryFn: () => getProduct(id), staleTime: 60_000, enabled: specific })),
  });
  const looked: Record<string, string> = {};
  unknown.forEach((id, i) => { const d = lookups[i]?.data; if (d) looked[id] = d.name; });
  const nameOf = (id: string): string => picked[id] ?? looked[id] ?? `Product #${id}`;

  const { data: categories = [] } = useCategories();
  const catName = (id: string): string => categories.find((c) => c.id === id)?.name ?? `Category #${id}`;
  const catMatches = categories
    .filter((c) => !categoryIds.includes(c.id) && c.name.toLowerCase().includes(categorySearch.trim().toLowerCase()))
    .slice(0, 8);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Applies to" className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input type="radio" name="coupon-scope" checked={!specific} onChange={() => onScope('all')} />
          All products
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
          <input type="radio" name="coupon-scope" checked={specific} onChange={() => onScope('specific')} />
          Specific products or categories
        </label>
      </div>

      {specific && (
        <div className="space-y-3 rounded-lg border border-[var(--border)] p-3">
          <div>
            <label htmlFor="scope-product-search" className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Products</label>
            <input id="scope-product-search" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className={inputCls} placeholder="Search products by name (2+ letters)" />
            {results.data && results.data.items.length > 0 && (
              <ul className="mt-1 max-h-44 overflow-auto rounded-md border border-[var(--border)]" data-testid="scope-product-results">
                {results.data.items.filter((p) => !productIds.includes(p.id)).map((p) => (
                  <li key={p.id}>
                    <button type="button" className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--surface-hover)]"
                      onClick={() => { setPicked((m) => ({ ...m, [p.id]: p.name })); onProducts([...productIds, p.id]); setProductSearch(''); }}>
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {results.data && results.data.items.length === 0 && <p className="mt-1 text-[11px] text-[var(--text-muted)]">No products match.</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {productIds.map((id) => <Chip key={id} label={nameOf(id)} onRemove={() => onProducts(productIds.filter((x) => x !== id))} />)}
            </div>
          </div>
          <div>
            <label htmlFor="scope-category-search" className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Categories</label>
            <input id="scope-category-search" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className={inputCls} placeholder="Search categories" />
            {categorySearch.trim() && catMatches.length > 0 && (
              <ul className="mt-1 max-h-44 overflow-auto rounded-md border border-[var(--border)]" data-testid="scope-category-results">
                {catMatches.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--surface-hover)]"
                      onClick={() => { onCategories([...categoryIds, c.id]); setCategorySearch(''); }}>
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categoryIds.map((id) => <Chip key={id} label={catName(id)} onRemove={() => onCategories(categoryIds.filter((x) => x !== id))} />)}
            </div>
          </div>
        </div>
      )}

      <p data-testid="scope-summary" className="text-xs font-medium text-[var(--text-primary)]">
        Applies to {specific ? couponScopeSummary(productIds, categoryIds) : 'all products'}
      </p>
      <p className="text-[11px] text-[var(--text-muted)]">
        {SCOPE_HELP} It also combines with &ldquo;Applies to items already on discount&rdquo;: an item must pass both.
      </p>
    </div>
  );
}
