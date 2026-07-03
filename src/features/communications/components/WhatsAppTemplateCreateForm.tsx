'use client';

import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateWhatsAppTemplate } from '../hooks/useCommunications';
import { WhatsAppMessagePreview } from './WhatsAppMessagePreview';
import type { WhatsAppTemplateComponent } from '@/types';

const buttonSchema = z.object({
  type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
  text: z.string().min(1, 'Button text is required'),
  url: z.string().optional(),
  phone_number: z.string().optional(),
});

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscores'),
  category: z.enum(['utility', 'marketing', 'authentication']),
  language_code: z.string().min(1, 'Language code is required'),
  hasHeader: z.boolean(),
  headerFormat: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']),
  headerText: z.string().optional(),
  bodyText: z.string().min(1, 'Body text is required'),
  hasFooter: z.boolean(),
  footerText: z.string().optional(),
  hasButtons: z.boolean(),
  buttons: z.array(buttonSchema),
});

type FormValues = z.infer<typeof formSchema>;

function buildComponents(values: FormValues): WhatsAppTemplateComponent[] {
  const comps: WhatsAppTemplateComponent[] = [];

  if (values.hasHeader) {
    const comp: WhatsAppTemplateComponent = { type: 'HEADER', format: values.headerFormat };
    if (values.headerFormat === 'TEXT') {
      comp.text = values.headerText ?? '';
    }
    comps.push(comp);
  }

  comps.push({ type: 'BODY', text: values.bodyText });

  if (values.hasFooter && values.footerText) {
    comps.push({ type: 'FOOTER', text: values.footerText });
  }

  if (values.hasButtons && values.buttons.length > 0) {
    comps.push({
      type: 'BUTTONS',
      buttons: values.buttons.map((b) => ({
        type: b.type,
        text: b.text,
        ...(b.type === 'URL' ? { url: b.url ?? '' } : {}),
        ...(b.type === 'PHONE_NUMBER' ? { phone_number: b.phone_number ?? '' } : {}),
      })),
    });
  }

  return comps;
}

const inputCls =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

const selectCls =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

interface Props {
  onClose: () => void;
}

export function WhatsAppTemplateCreateForm({ onClose }: Props) {
  const mutation = useCreateWhatsAppTemplate();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        category: 'utility',
        language_code: 'en_US',
        hasHeader: false,
        headerFormat: 'TEXT',
        headerText: '',
        bodyText: '',
        hasFooter: false,
        footerText: '',
        hasButtons: false,
        buttons: [],
      },
    });

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control,
    name: 'buttons',
  });

  const watchedValues = useWatch({ control });

  const hasHeader = watch('hasHeader');
  const headerFormat = watch('headerFormat');
  const hasFooter = watch('hasFooter');
  const hasButtons = watch('hasButtons');

  const liveComponents = buildComponents({
    name: watchedValues.name ?? '',
    category: watchedValues.category ?? 'utility',
    language_code: watchedValues.language_code ?? 'en_US',
    hasHeader: watchedValues.hasHeader ?? false,
    headerFormat: watchedValues.headerFormat ?? 'TEXT',
    headerText: watchedValues.headerText ?? '',
    bodyText: watchedValues.bodyText ?? '',
    hasFooter: watchedValues.hasFooter ?? false,
    footerText: watchedValues.footerText ?? '',
    hasButtons: watchedValues.hasButtons ?? false,
    buttons: (watchedValues.buttons ?? []).map((b) => ({
      type: b?.type ?? 'QUICK_REPLY',
      text: b?.text ?? '',
      url: b?.url ?? '',
      phone_number: b?.phone_number ?? '',
    })),
  });

  async function onSubmit(values: FormValues) {
    try {
      await mutation.mutateAsync({
        name: values.name,
        category: values.category,
        language_code: values.language_code,
        components: buildComponents(values),
      });
      toast.success('Template submitted to Meta for approval');
      onClose();
    } catch {
      toast.error('Failed to create template');
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-muted/30 mb-4">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[13px] font-semibold text-foreground">New WhatsApp Template</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-4 space-y-4 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Name</label>
              <input
                {...register('name')}
                className={inputCls}
                placeholder="e.g. proof_ready_for_approval"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Lowercase letters, numbers and underscores only</p>
              {errors.name && <p className="mt-0.5 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Category</label>
              <select {...register('category')} className={selectCls}>
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
                <option value="authentication">Authentication</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Language Code</label>
              <input {...register('language_code')} className={inputCls} placeholder="en_US" />
              {errors.language_code && (
                <p className="mt-1 text-xs text-destructive">{errors.language_code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                checked={hasHeader}
                onChange={(e) => setValue('hasHeader', e.target.checked)}
              />
              <span className="text-xs font-semibold text-foreground">Add Header (optional)</span>
            </label>
            {hasHeader && (
              <div className="pl-6 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Header Format</label>
                  <select {...register('headerFormat')} className={selectCls}>
                    <option value="TEXT">Text</option>
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </div>
                {headerFormat === 'TEXT' && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Header Text</label>
                    <input {...register('headerText')} className={inputCls} placeholder="Header text" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Body <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register('bodyText')}
              rows={4}
              className={inputCls}
              placeholder="Your message body text..."
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Use <code className="bg-muted px-1 rounded text-[10px]">{'{{1}}'}</code>,{' '}
              <code className="bg-muted px-1 rounded text-[10px]">{'{{2}}'}</code>,{' '}
              <code className="bg-muted px-1 rounded text-[10px]">{'{{3}}'}</code> for variables
            </p>
            {errors.bodyText && (
              <p className="mt-1 text-xs text-destructive">{errors.bodyText.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                checked={hasFooter}
                onChange={(e) => setValue('hasFooter', e.target.checked)}
              />
              <span className="text-xs font-semibold text-foreground">Add Footer (optional)</span>
            </label>
            {hasFooter && (
              <div className="pl-6">
                <input
                  {...register('footerText')}
                  className={inputCls}
                  placeholder="e.g. Urgent Printers"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                checked={hasButtons}
                onChange={(e) => {
                  setValue('hasButtons', e.target.checked);
                  if (!e.target.checked) setValue('buttons', []);
                }}
              />
              <span className="text-xs font-semibold text-foreground">Add Buttons (optional)</span>
            </label>
            {hasButtons && (
              <div className="pl-6 space-y-3">
                {buttonFields.map((field, index) => {
                  const btnType = watch(`buttons.${index}.type`);
                  return (
                    <div key={field.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Button {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">Type</label>
                          <select {...register(`buttons.${index}.type`)} className={selectCls}>
                            <option value="QUICK_REPLY">Quick Reply</option>
                            <option value="URL">URL</option>
                            <option value="PHONE_NUMBER">Phone Number</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">Button Text</label>
                          <input
                            {...register(`buttons.${index}.text`)}
                            className={inputCls}
                            placeholder="Button label"
                          />
                          {errors.buttons?.[index]?.text && (
                            <p className="mt-0.5 text-xs text-destructive">
                              {errors.buttons[index]?.text?.message}
                            </p>
                          )}
                        </div>
                      </div>
                      {btnType === 'URL' && (
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">URL</label>
                          <input
                            {...register(`buttons.${index}.url`)}
                            className={inputCls}
                            placeholder="https://example.com"
                          />
                        </div>
                      )}
                      {btnType === 'PHONE_NUMBER' && (
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">Phone Number</label>
                          <input
                            {...register(`buttons.${index}.phone_number`)}
                            className={inputCls}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {buttonFields.length < 3 && (
                  <button
                    type="button"
                    onClick={() => appendButton({ type: 'QUICK_REPLY', text: '' })}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Button
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting…' : 'Submit to Meta'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        <div className="lg:w-72 p-4 bg-muted/20 flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Live Preview
          </p>
          <WhatsAppMessagePreview components={liveComponents} />
        </div>
      </div>
    </div>
  );
}
