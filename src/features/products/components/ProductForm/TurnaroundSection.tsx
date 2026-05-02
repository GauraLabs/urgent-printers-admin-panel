import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

const TYPES = [
  { key: 0, label: 'Standard', color: 'text-green-700' },
  { key: 1, label: 'Express', color: 'text-orange-700' },
  { key: 2, label: 'Rush', color: 'text-red-700' },
] as const;

const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] tabular-nums';

export function TurnaroundSection({ form }: Props) {
  const { register } = form;
  return (
    <div className="space-y-3">
      {TYPES.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-4 p-3 bg-[var(--surface-secondary)] rounded-lg">
          <span className={`text-xs font-semibold w-16 ${color}`}>{label}</span>
          <div className="flex items-center gap-2">
            <input
              {...register(`turnaround_options.${key}.days`, { valueAsNumber: true })}
              type="number"
              min={1}
              className={`${inputCls} w-16`}
            />
            <span className="text-xs text-[var(--text-muted)]">days</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Extra cost</span>
            <span className="text-xs text-[var(--text-muted)]">₹</span>
            <input
              {...register(`turnaround_options.${key}.extra_cost`, { valueAsNumber: true })}
              type="number"
              min={0}
              className={`${inputCls} w-20`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
