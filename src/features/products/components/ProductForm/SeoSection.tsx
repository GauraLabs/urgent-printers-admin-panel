import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from './index';

interface Props { form: UseFormReturn<ProductFormValues> }

const inputCls = 'w-full px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const labelCls = 'block text-xs font-medium text-[var(--text-primary)] mb-1.5';

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value?.length ?? 0;
  return (
    <span className={`text-[11px] ${len > max ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
      {len}/{max}
    </span>
  );
}

export function SeoSection({ form }: Props) {
  const { register, watch } = form;
  const title = watch('seo.title') ?? '';
  const description = watch('seo.description') ?? '';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls.replace('mb-1.5', '')}>Meta Title</label>
          <CharCount value={title} max={60} />
        </div>
        <input {...register('seo.title')} className={inputCls} placeholder="Leave blank to use product name" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls.replace('mb-1.5', '')}>Meta Description</label>
          <CharCount value={description} max={160} />
        </div>
        <textarea {...register('seo.description')} rows={3} className={inputCls} placeholder="Leave blank to use short description" />
      </div>
      <div>
        <label className={labelCls}>Canonical URL Override</label>
        <input {...register('seo.canonical_url')} className={inputCls} placeholder="https://…" />
      </div>
    </div>
  );
}
