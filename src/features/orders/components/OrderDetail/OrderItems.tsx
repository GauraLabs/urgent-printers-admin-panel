import Image from 'next/image';
import { FileText, LayoutTemplate, AlertTriangle, Paperclip } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ArtworkStatusBadge, Badge } from '@/components/common/StatusBadge';
import type { OrderItem } from '@/types';

function titleCase(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function ArtworkSection({ item }: { item: OrderItem }) {
  if (item.artwork_type === 'file') {
    return (
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)]" />
            <span className="font-medium text-[var(--text-primary)]">
              {item.artwork_filename ?? item.artwork_file_key ?? 'Artwork file'}
            </span>
          </span>
          <ArtworkStatusBadge status={item.artwork_status} />
        </div>
      </div>
    );
  }

  if (item.artwork_type === 'template' && item.template_data && Object.keys(item.template_data).length > 0) {
    return (
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] mb-2">
          <LayoutTemplate className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          Template data
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {Object.entries(item.template_data).map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">{titleCase(key)}</dt>
              <dd className="text-[11px] text-[var(--text-primary)] break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2">
          <ArtworkStatusBadge status={item.artwork_status} />
        </div>
      </div>
    );
  }

  if (item.artwork_type === null) {
    return (
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          No artwork provided
        </span>
      </div>
    );
  }

  return null;
}

export function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Items <span className="text-[var(--text-muted)] font-normal">({items.length})</span>
        </h3>
      </div>
      <ul className="divide-y divide-[var(--border-subtle)]">
        {items.map((item) => {
          const specPills = [item.size_label, item.paper_label, item.finish_label, item.sides].filter(
            (v): v is string => Boolean(v)
          );
          return (
            <li key={item.id} className="p-4">
              {/* Header row */}
              <div className="flex items-start gap-3">
                {item.thumbnail_url ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0 bg-[var(--surface-secondary)]">
                    <Image
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-[var(--border)] flex-shrink-0 bg-[var(--surface-secondary)] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{item.product_name}</p>
                  {item.category_name && (
                    <Badge
                      label={item.category_name}
                      variant="info"
                      dot={false}
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatPrice(item.total_price)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                    {item.quantity} × {formatPrice(item.price_per_unit)}
                  </p>
                </div>
              </div>

              {/* Spec row */}
              {specPills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {specPills.map((spec) => (
                    <span
                      key={spec}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Turnaround row */}
              {item.turnaround_label && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                    {item.turnaround_label}
                  </span>
                </div>
              )}

              {/* Artwork section */}
              <ArtworkSection item={item} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
