import Image from 'next/image';
import { FileImage } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ArtworkStatusBadge } from '@/components/common/StatusBadge';
import type { OrderItem } from '@/types';

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
          const specLine = [item.size_label, item.paper_label, item.finish_label, item.sides].filter(
            (v): v is string => Boolean(v)
          );
          return (
            <li key={item.id} className="p-4">
              <div className="flex items-start gap-3 mb-3">
                {item.thumbnail_url && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0 bg-[var(--surface-secondary)]">
                    <Image
                      src={item.thumbnail_url}
                      alt={item.product_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.product_name}</p>
                  {specLine.length > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {specLine.join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatPrice(item.total_price)}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{item.quantity} × {formatPrice(item.price_per_unit)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.turnaround_label && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                    {item.turnaround_label}
                  </span>
                )}
                <ArtworkStatusBadge status={item.artwork_status} />
                {item.artwork_file_key && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <FileImage className="h-3 w-3" /> Artwork uploaded
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
