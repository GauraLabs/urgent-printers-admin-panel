'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

export function PricingSection({ form }: Props) {
  const { register, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'pricing_tiers' });

  const tiers = watch('pricing_tiers') ?? [];
  const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] tabular-nums';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Quantity</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Price / unit (₹)</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Total (₹)</th>
              <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-medium">Best Value</th>
              <th className="py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {fields.map((field, i) => {
              const qty = tiers[i]?.quantity ?? 0;
              const price = tiers[i]?.price_per_unit ?? 0;
              const total = qty * price;
              return (
                <tr key={field.id}>
                  <td className="py-2 pr-3">
                    <input
                      {...register(`pricing_tiers.${i}.quantity`, { valueAsNumber: true })}
                      type="number"
                      placeholder="500"
                      className={`${inputCls} w-24`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      {...register(`pricing_tiers.${i}.price_per_unit`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      className={`${inputCls} w-24`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <span className="text-[var(--text-secondary)] tabular-nums">
                      {total > 0 ? formatPrice(total) : '—'}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => {
                        fields.forEach((_, j) => setValue(`pricing_tiers.${j}.is_best_value`, j === i));
                      }}
                      className={tiers[i]?.is_best_value ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-400'}
                      title="Mark as best value"
                    >
                      <Star className={`h-4 w-4 ${tiers[i]?.is_best_value ? 'fill-yellow-500' : ''}`} />
                    </button>
                  </td>
                  <td className="py-2">
                    <button type="button" onClick={() => remove(i)} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {fields.length === 0 && <p className="text-xs text-[var(--text-muted)] py-3">No pricing tiers yet.</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => append({ id: '', quantity: 0, price_per_unit: 0, is_best_value: false })}
      >
        <Plus className="h-3.5 w-3.5" /> Add Tier
      </Button>
    </div>
  );
}
