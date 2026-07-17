'use client';

import { useMemo } from 'react';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/features/categories/hooks/useCategories';

// Mirrors backend's `_validate_link_url` in urgent-printers-backend/app/schemas/admin.py
// exactly — must stay in sync so a "Custom URL" entry never round-trips a 422.
export const LINK_URL_PATTERN = /^(https?:\/\/|\/)/;
export const LINK_URL_INVALID_MESSAGE = 'Must start with http://, https://, or /';

export function isValidLinkUrl(v: string | undefined | null): boolean {
  return !v || LINK_URL_PATTERN.test(v);
}

export const STATIC_PAGES: { label: string; value: string }[] = [
  { label: 'Home', value: '/' },
  { label: 'All Products', value: '/products' },
  { label: 'Cart', value: '/cart' },
  { label: 'Checkout', value: '/checkout' },
  { label: 'Contact', value: '/contact' },
  { label: 'Search', value: '/search' },
  { label: 'Returns Policy', value: '/policies/returns' },
  { label: 'Terms', value: '/policies/terms' },
  { label: 'Shipping Policy', value: '/policies/shipping' },
  { label: 'Cookies Policy', value: '/policies/cookies' },
  { label: 'Artwork Guidelines', value: '/policies/artwork-guidelines' },
  { label: 'Privacy Policy', value: '/policies/privacy' },
];

const NONE_VALUE = '__none__';
const CUSTOM_VALUE = '__custom__';

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const errCls = 'mt-1 text-xs text-[var(--danger)]';

interface LinkUrlPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function LinkUrlPicker({ value, onChange, error, disabled }: LinkUrlPickerProps) {
  const { data: categories } = useCategories();

  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ label: c.name, value: `/products/${c.slug}` })),
    [categories],
  );

  const isKnownPreset = useMemo(() => {
    const all = new Set<string>([...STATIC_PAGES.map((p) => p.value), ...categoryOptions.map((c) => c.value)]);
    return all.has(value);
  }, [value, categoryOptions]);

  const isCustom = value !== '' && !isKnownPreset;
  const selectValue = value === '' ? NONE_VALUE : isCustom ? CUSTOM_VALUE : value;

  function handleSelectChange(next: string | null) {
    const v = next ?? NONE_VALUE;
    if (v === NONE_VALUE) onChange('');
    else if (v === CUSTOM_VALUE) onChange(isCustom ? value : '');
    else onChange(v);
  }

  return (
    <div>
      <Select value={selectValue} onValueChange={handleSelectChange} disabled={disabled}>
        <SelectTrigger className="w-full"><SelectValue placeholder="No link" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>No link</SelectItem>
          <SelectGroup>
            <SelectLabel>Pages</SelectLabel>
            {STATIC_PAGES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectGroup>
          {categoryOptions.length > 0 && (
            <SelectGroup>
              <SelectLabel>Categories</SelectLabel>
              {categoryOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectGroup>
          )}
          <SelectItem value={CUSTOM_VALUE}>Custom URL…</SelectItem>
        </SelectContent>
      </Select>
      {selectValue === CUSTOM_VALUE && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://example.com or /products/business-cards"
          className={`${inputCls} mt-2`}
        />
      )}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}
