'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

const TYPES = [
  { key: 0, label: 'Standard', color: 'text-green-700 dark:text-green-400', required: true },
  { key: 1, label: 'Express',  color: 'text-orange-600 dark:text-orange-400', required: false },
  { key: 2, label: 'Rush',     color: 'text-red-600 dark:text-red-400',    required: false },
] as const;

// Fixed 3-slot shape the section always renders (Standard/Express/Rush at
// indices 0/1/2). Used to normalise `product.turnaround_options` into a
// complete, well-typed tuple before the form mounts — some real seeded
// products only have 1-2 entries (e.g. no Rush option ever configured), and
// this component has no add/remove affordance, so without normalising first
// the register()'d days/extra_cost inputs for a missing slot would seed
// themselves from an empty, untyped DOM value instead of a real default.
export const TURNAROUND_DEFAULTS = [
  { type: 'standard', days: 5, extra_cost: 0,   is_active: true  },
  { type: 'express',  days: 3, extra_cost: 200, is_active: false },
  { type: 'rush',     days: 1, extra_cost: 500, is_active: false },
] as const;

export function normaliseTurnaroundOptions(
  options: readonly { type: string; days: number; extra_cost: number; is_active: boolean }[] | undefined
): { type: string; days: number; extra_cost: number; is_active: boolean }[] {
  return TURNAROUND_DEFAULTS.map((def) => {
    const existing = options?.find((o) => o.type === def.type);
    if (!existing) return { ...def };
    return def.type === 'standard' ? { ...existing, is_active: true } : existing;
  });
}

const inputCls = 'px-2.5 py-1.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 tabular-nums disabled:opacity-40';

export function TurnaroundSection({ form }: Props) {
  const { register, watch, setValue } = form;

  return (
    <div className="space-y-2">
      {TYPES.map(({ key, label, color, required }) => {
        const isActive = watch(`turnaround_options.${key}.is_active`);
        return (
          <div
            key={key}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
              isActive ? 'bg-muted/30 border-border' : 'bg-muted/10 border-border/40 opacity-60'
            }`}
          >
            {/* Active toggle — Standard is always on */}
            <Switch
              checked={isActive}
              onCheckedChange={(v) => setValue(`turnaround_options.${key}.is_active`, v, { shouldDirty: true })}
              size="sm"
              disabled={required}
            />

            <span className={`text-xs font-semibold w-16 flex-shrink-0 ${color}`}>{label}</span>

            <div className="flex items-center gap-2">
              <input
                {...register(`turnaround_options.${key}.days`, { valueAsNumber: true })}
                type="number"
                min={1}
                disabled={!isActive}
                className={`${inputCls} w-16`}
              />
              <span className="text-xs text-muted-foreground">days</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">+₹</span>
              <input
                {...register(`turnaround_options.${key}.extra_cost`, { valueAsNumber: true })}
                type="number"
                min={0}
                disabled={!isActive}
                className={`${inputCls} w-20`}
              />
            </div>

            {!required && !isActive && (
              <span className="text-[11px] text-muted-foreground ml-auto">Not offered</span>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground pt-1">
        Standard is always available. Toggle Express / Rush on if you offer them for this product.
      </p>
    </div>
  );
}
