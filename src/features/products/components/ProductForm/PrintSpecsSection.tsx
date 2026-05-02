'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function DynamicList({
  label, items, onAdd, onRemove, addLabel = 'Add',
  children,
}: {
  label: string;
  items: unknown[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  addLabel?: string;
  children: (i: number) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
        <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={onAdd}>
          <Plus className="h-3 w-3" /> {addLabel}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            {children(i)}
            <button type="button" onClick={() => onRemove(i)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors flex-shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-[var(--text-muted)]">None added yet.</p>}
      </div>
    </div>
  );
}

export function PrintSpecsSection({ form }: Props) {
  const { register, watch, setValue } = form;

  const { fields: sizes, append: addSize, remove: removeSize } = useFieldArray({ control: form.control, name: 'sizes' });
  const { fields: papers, append: addPaper, remove: removePaper } = useFieldArray({ control: form.control, name: 'paper_types' });
  const { fields: finishes, append: addFinish, remove: removeFinish } = useFieldArray({ control: form.control, name: 'finishes' });

  const sidesOptions = watch('sides_options') ?? [];
  const quantitySteps = watch('quantity_steps') ?? [];

  return (
    <div className="space-y-6">
      {/* Sizes */}
      <DynamicList label="Sizes" items={sizes} onAdd={() => addSize({ id: '', label: '', width_mm: 0, height_mm: 0, is_active: true })} onRemove={removeSize}>
        {(i) => (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input {...register(`sizes.${i}.label`)} placeholder="90mm × 54mm" className={`${inputCls} flex-1 min-w-28`} />
            <input {...register(`sizes.${i}.width_mm`, { valueAsNumber: true })} placeholder="W" type="number" className={`${inputCls} w-16`} />
            <span className="text-xs text-[var(--text-muted)]">×</span>
            <input {...register(`sizes.${i}.height_mm`, { valueAsNumber: true })} placeholder="H" type="number" className={`${inputCls} w-16`} />
            <span className="text-[11px] text-[var(--text-muted)]">mm</span>
          </div>
        )}
      </DynamicList>

      {/* Paper types */}
      <DynamicList label="Paper Types" items={papers} onAdd={() => addPaper({ id: '', label: '', gsm: null, is_active: true })} onRemove={removePaper}>
        {(i) => (
          <div className="flex items-center gap-2 flex-1">
            <input {...register(`paper_types.${i}.label`)} placeholder="350 GSM Art Board" className={`${inputCls} flex-1`} />
            <input {...register(`paper_types.${i}.gsm`, { valueAsNumber: true })} placeholder="GSM" type="number" className={`${inputCls} w-20`} />
          </div>
        )}
      </DynamicList>

      {/* Finishes */}
      <DynamicList label="Finishes" items={finishes} onAdd={() => addFinish({ id: '', label: '', is_active: true })} onRemove={removeFinish}>
        {(i) => <input {...register(`finishes.${i}.label`)} placeholder="Matte Lamination" className={`${inputCls} flex-1`} />}
      </DynamicList>

      {/* Sides options — simple tag list */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Sides Options</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {sidesOptions.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-xs">
              {s}
              <button type="button" onClick={() => setValue('sides_options', sidesOptions.filter((_, j) => j !== i))} className="text-[var(--text-muted)] hover:text-[var(--danger)]">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {['Single Sided', 'Double Sided'].filter((o) => !sidesOptions.includes(o)).map((o) => (
            <button key={o} type="button" onClick={() => setValue('sides_options', [...sidesOptions, o])}
              className="text-xs px-2 py-1 border border-dashed border-[var(--border)] rounded text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
              + {o}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity steps */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Quantity Steps</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {quantitySteps.map((q, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-xs">
              {q}
              <button type="button" onClick={() => setValue('quantity_steps', quantitySteps.filter((_, j) => j !== i))} className="text-[var(--text-muted)] hover:text-[var(--danger)]">×</button>
            </span>
          ))}
        </div>
        <input
          type="number"
          placeholder="Add qty (e.g. 250) and press Enter"
          className={`${inputCls} w-56`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const val = parseInt((e.target as HTMLInputElement).value);
              if (val > 0 && !quantitySteps.includes(val)) {
                setValue('quantity_steps', [...quantitySteps, val].sort((a, b) => a - b));
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
        />
      </div>
    </div>
  );
}
