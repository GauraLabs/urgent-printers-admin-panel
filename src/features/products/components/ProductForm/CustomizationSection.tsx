'use client';

import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Palette, LayoutTemplate, Layers, Ban } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ProductFormValues } from './index';
import type { CustomizationMode } from '@/types';

interface Props { form: UseFormReturn<ProductFormValues> }

const inputCls = 'px-2.5 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';

const MODES: { value: CustomizationMode; label: string; description: string; Icon: React.ElementType }[] = [
  { value: 'none',     label: 'No customization',  description: 'Print-ready file only',           Icon: Ban           },
  { value: 'artwork',  label: 'Upload artwork',     description: 'Customer uploads their own file', Icon: Palette       },
  { value: 'template', label: 'Fill template',      description: 'Customer fills in text fields',   Icon: LayoutTemplate },
  { value: 'both',     label: 'Artwork + Template', description: 'Upload file and fill fields',     Icon: Layers        },
];

const FIELD_TYPES = ['text', 'email', 'phone', 'multiline', 'url'] as const;

function deriveId(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function CustomizationSection({ form }: Props) {
  const { register, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'template_fields' });

  const mode = watch('customization_mode');
  const showFields = mode === 'template' || mode === 'both';

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Customization mode</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MODES.map(({ value, label, description, Icon }) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('customization_mode', value, { shouldDirty: true })}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 border rounded-lg text-left transition-colors',
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-secondary)]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn('text-xs font-medium', active ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]')}>{label}</span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template field builder */}
      {showFields && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Template fields</p>
            <button
              type="button"
              onClick={() => append({ id: '', label: '', type: 'text', placeholder: '', required: true, max_length: undefined })}
              className="flex items-center gap-1 text-xs px-2 py-1 border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              <Plus className="h-3 w-3" /> Add field
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2 p-3 border border-[var(--border)] rounded-lg bg-[var(--surface-secondary)]">
                <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* Label — id is auto-derived */}
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      {...register(`template_fields.${i}.label`, {
                        onChange: (e) => {
                          setValue(`template_fields.${i}.id`, deriveId(e.target.value));
                        },
                      })}
                      placeholder="Field label (e.g. Full Name)"
                      className={`${inputCls} flex-1`}
                    />
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                      id: <code className="font-mono">{watch(`template_fields.${i}.id`) || '…'}</code>
                    </span>
                  </div>

                  {/* Type */}
                  <select {...register(`template_fields.${i}.type`)} className={inputCls}>
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {/* Placeholder */}
                  <input
                    {...register(`template_fields.${i}.placeholder`)}
                    placeholder="Placeholder (optional)"
                    className={inputCls}
                  />

                  {/* Max length */}
                  <input
                    {...register(`template_fields.${i}.max_length`, { valueAsNumber: true })}
                    type="number"
                    placeholder="Max length (optional)"
                    className={inputCls}
                  />

                  {/* Required toggle */}
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`template_fields.${i}.required`)}
                      className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                    />
                    Required
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors mt-0.5 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {fields.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">No template fields yet. Add one above.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
