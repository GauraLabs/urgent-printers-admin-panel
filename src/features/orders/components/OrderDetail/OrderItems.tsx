import { FileImage } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ArtworkStatusBadge, TurnaroundBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils/cn';
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
          const specLine = [item.size, item.paper_type, item.finish, item.sides].filter(
            (v): v is string => Boolean(v)
          );
          return (
            <li key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.product_name}</p>
                  {specLine.length > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {specLine.join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{formatPrice(item.total_price)}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{item.quantity} × {formatPrice(item.unit_price)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TurnaroundBadge type={item.turnaround} />
                <ArtworkStatusBadge status={item.artwork_status} />
                {item.artwork_file_url && (
                  <a href={item.artwork_file_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] hover:underline">
                    <FileImage className="h-3 w-3" /> View artwork
                  </a>
                )}
              </div>
              {item.custom_notes && (
                <p className="mt-2 text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded px-2 py-1.5">
                  <span className="font-medium">Customer note:</span> {item.custom_notes}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
