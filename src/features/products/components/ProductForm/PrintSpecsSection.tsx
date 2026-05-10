'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

function MultiplierLabel({ value }: { value: number }) {
  if (!value || Number.isNaN(value) || value <= 0) return <span className="w-14 shrink-0" />;
  if (Math.abs(value - 1) < 0.005) {
    return <span className="text-[10px] text-[var(--text-muted)] w-14 shrink-0">base price</span>;
  }
  const pct = Math.round((value - 1) * 100);
  return (
    <span className={`text-[10px] w-14 shrink-0 font-medium ${pct > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      {pct > 0 ? `+${pct}%` : `${pct}%`}
    </span>
  );
}

function DefaultToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? 'Default' : 'Set as default'}
      className={cn(
        'shrink-0 w-4 h-4 rounded-full border-2 transition-colors',
        active
          ? 'border-[var(--primary)] bg-[var(--primary)]'
          : 'border-[var(--border)] hover:border-[var(--primary)]'
      )}
    />
  );
}

function DynamicList({
  label, items, onAdd, onRemove, addLabel = 'Add', children,
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
            <button type="button" onClick={() => onRemove(i)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-[var(--text-muted)]">None added yet.</p>}
      </div>
    </div>
  );
}

type SpecGroup = 'sizes' | 'paper_types' | 'finishes' | 'sides_options';

export function PrintSpecsSection({ form }: Props) {
  const { register, watch, setValue } = form;

  const { fields: sizes,   append: addSize,   remove: removeSize   } = useFieldArray({ control: form.control, name: 'sizes' });
  const { fields: papers,  append: addPaper,  remove: removePaper  } = useFieldArray({ control: form.control, name: 'paper_types' });
  const { fields: finishes, append: addFinish, remove: removeFinish } = useFieldArray({ control: form.control, name: 'finishes' });
  const { fields: sides,   append: addSide,   remove: removeSide   } = useFieldArray({ control: form.control, name: 'sides_options' });

  const watchedSizes    = watch('sizes')          ?? [];
  const watchedPapers   = watch('paper_types')    ?? [];
  const watchedFinishes = watch('finishes')       ?? [];
  const watchedSides    = watch('sides_options')  ?? [];
  const quantitySteps   = watch('quantity_steps') ?? [];

  function setDefault(group: SpecGroup, idx: number) {
    const current = form.getValues(group) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(group, current.map((item: any, i: number) => ({ ...item, is_default: i === idx })), { shouldDirty: true });
  }

  return (
    <div className="space-y-6">
      {/* Sizes */}
      <DynamicList
        label="Sizes"
        items={sizes}
        onAdd={() => addSize({ label: '', width: 0, height: 0, unit: 'mm', is_active: true, is_default: false, price_multiplier: 1.0 })}
        onRemove={removeSize}
      >
        {(i) => (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input {...register(`sizes.${i}.label`)} placeholder="e.g. A4 Portrait" className={`${inputCls} flex-1 min-w-28`} />
            <input {...register(`sizes.${i}.width`,  { valueAsNumber: true })} placeholder="W" type="number" className={`${inputCls} w-16`} />
            <span className="text-xs text-[var(--text-muted)] shrink-0">×</span>
            <input {...register(`sizes.${i}.height`, { valueAsNumber: true })} placeholder="H" type="number" className={`${inputCls} w-16`} />
            <select {...register(`sizes.${i}.unit`)} className={`${inputCls} w-16`}>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
              <option value="ft">ft</option>
            </select>
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">×</span>
            <input {...register(`sizes.${i}.price_multiplier`, { valueAsNumber: true })} type="number" step="0.01" min="0.1" className={`${inputCls} w-16`} />
            <MultiplierLabel value={watchedSizes[i]?.price_multiplier ?? 1} />
            <input type="checkbox" {...register(`sizes.${i}.is_active`)} title="Active" className="h-3.5 w-3.5 rounded shrink-0 cursor-pointer accent-[var(--primary)]" />
            <DefaultToggle active={!!watchedSizes[i]?.is_default} onClick={() => setDefault('sizes', i)} />
          </div>
        )}
      </DynamicList>

      {/* Paper types */}
      <DynamicList
        label="Paper Types"
        items={papers}
        onAdd={() => addPaper({ label: '', gsm: null, is_active: true, is_default: false, price_multiplier: 1.0 })}
        onRemove={removePaper}
      >
        {(i) => (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input {...register(`paper_types.${i}.label`)} placeholder="350 GSM Art Board" className={`${inputCls} flex-1`} />
            <input {...register(`paper_types.${i}.gsm`, { valueAsNumber: true })} placeholder="GSM" type="number" className={`${inputCls} w-20`} />
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">×</span>
            <input {...register(`paper_types.${i}.price_multiplier`, { valueAsNumber: true })} type="number" step="0.01" min="0.1" className={`${inputCls} w-16`} />
            <MultiplierLabel value={watchedPapers[i]?.price_multiplier ?? 1} />
            <input type="checkbox" {...register(`paper_types.${i}.is_active`)} title="Active" className="h-3.5 w-3.5 rounded shrink-0 cursor-pointer accent-[var(--primary)]" />
            <DefaultToggle active={!!watchedPapers[i]?.is_default} onClick={() => setDefault('paper_types', i)} />
          </div>
        )}
      </DynamicList>

      {/* Finishes */}
      <DynamicList
        label="Finishes"
        items={finishes}
        onAdd={() => addFinish({ label: '', is_active: true, is_default: false, price_multiplier: 1.0 })}
        onRemove={removeFinish}
      >
        {(i) => (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input {...register(`finishes.${i}.label`)} placeholder="Matte Lamination" className={`${inputCls} flex-1`} />
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">×</span>
            <input {...register(`finishes.${i}.price_multiplier`, { valueAsNumber: true })} type="number" step="0.01" min="0.1" className={`${inputCls} w-16`} />
            <MultiplierLabel value={watchedFinishes[i]?.price_multiplier ?? 1} />
            <input type="checkbox" {...register(`finishes.${i}.is_active`)} title="Active" className="h-3.5 w-3.5 rounded shrink-0 cursor-pointer accent-[var(--primary)]" />
            <DefaultToggle active={!!watchedFinishes[i]?.is_default} onClick={() => setDefault('finishes', i)} />
          </div>
        )}
      </DynamicList>

      {/* Sides options */}
      <div className="space-y-2">
        <DynamicList
          label="Sides Options"
          items={sides}
          onAdd={() => addSide({ label: '', is_default: false, price_multiplier: 1.0 })}
          onRemove={removeSide}
          addLabel="Add Side"
        >
          {(i) => (
            <div className="flex items-center gap-2 flex-1">
              <input {...register(`sides_options.${i}.label`)} placeholder="e.g. Single Sided" className={`${inputCls} flex-1`} />
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">×</span>
              <input {...register(`sides_options.${i}.price_multiplier`, { valueAsNumber: true })} type="number" step="0.01" min="0.1" className={`${inputCls} w-16`} />
              <MultiplierLabel value={watchedSides[i]?.price_multiplier ?? 1} />
              <DefaultToggle active={!!watchedSides[i]?.is_default} onClick={() => setDefault('sides_options', i)} />
            </div>
          )}
        </DynamicList>

        {/* Quick-add preset sides */}
        {(['Single Sided', 'Double Sided'] as const)
          .filter((o) => !watchedSides.some((s) => s?.label === o))
          .map((o) => (
            <button key={o} type="button"
              onClick={() => addSide({ label: o, is_default: watchedSides.length === 0, price_multiplier: o === 'Single Sided' ? 1.0 : 1.35 })}
              className="text-xs px-2 py-1 border border-dashed border-[var(--border)] rounded text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors mr-2">
              + {o}
            </button>
          ))}
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
