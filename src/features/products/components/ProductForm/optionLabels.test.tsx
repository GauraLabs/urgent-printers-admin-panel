import { describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { PrintSpecsSection } from './PrintSpecsSection';
import { productSchema, normalizeOptionLabel, DUPLICATE_OPTION_MESSAGE, type ProductFormValues } from './schema';
import { codedErrorMessage, optionGroupFromMessage } from '@/lib/api/validationErrors';

const base = {
  name: 'Cards', slug: 'cards', short_description: 'x', category_id: '3', status: 'draft', customization_mode: 'none' as const,
  pricing_tiers: [{ quantity: 100, price_per_unit: 9, mrp_per_unit: null, is_best_value: false }],
};
const fin = (label: string) => ({ label, is_active: true, is_default: false, price_multiplier: 1 });
const paths = (over: object) =>
  productSchema.safeParse({ ...base, ...over }).error?.issues.map((i) => `${i.path.join('.')}|${i.message}`) ?? [];

describe('duplicate option labels', () => {
  it('normalizes like the backend', () => {
    expect(normalizeOptionLabel('Matte Lamination')).toBe(normalizeOptionLabel(' matte-lamination '));
  });
  it('flags the later duplicate row only', () => {
    expect(paths({ finishes: [fin('Matte Lamination'), fin('Gloss'), fin('matte-lamination ')] }))
      .toEqual([`finishes.2.label|${DUPLICATE_OPTION_MESSAGE}`]);
  });
  it('checks each category independently and ignores blank labels', () => {
    expect(paths({ finishes: [fin('Matte')], sides_options: [fin('Matte')] })).toEqual([]);
    expect(paths({ finishes: [fin(''), fin('')] })).toEqual([]);
    expect(paths({ sides_options: [fin('Single'), fin('SINGLE')] })[0]).toMatch(/^sides_options\.1\.label\|/);
  });
});

describe('duplicate_option_label mapping', () => {
  it('has a friendly message and resolves the group from the backend text', () => {
    expect(codedErrorMessage('duplicate_option_label')).toMatch(/unique label/);
    expect(optionGroupFromMessage("Duplicate finishes option label 'Paper Finish'")).toBe('finishes');
    expect(optionGroupFromMessage("Duplicate sizes option label 'Sides Paper Finish'")).toBe('sizes');
    expect(optionGroupFromMessage("Duplicate sides_options option label 'Large Size'")).toBe('sides_options');
    expect(optionGroupFromMessage("Duplicate paper_types option label 'Finishes'")).toBe('paper_types');
    expect(optionGroupFromMessage('nothing')).toBeUndefined();
  });
});

function Harness() {
  const form = useForm<ProductFormValues>({ defaultValues: { finishes: [fin('Matte')], sizes: [], paper_types: [], sides_options: [] } });
  useEffect(() => { form.setError('finishes.0.label', { type: 'custom', message: DUPLICATE_OPTION_MESSAGE }); }, [form]);
  return <PrintSpecsSection form={form} />;
}

describe('PrintSpecsSection', () => {
  it('shows the rename hint, no id inputs, and the row error', async () => {
    render(<Harness />);
    expect(screen.getByTestId('option-rename-hint')).toHaveTextContent(/Renaming an option changes its identity/);
    expect(screen.queryByLabelText(/\bid\b/i)).toBeNull();
    expect(await screen.findByRole('alert')).toHaveTextContent(DUPLICATE_OPTION_MESSAGE);
  });
});
