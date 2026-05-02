import { CheckCircle2, Circle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatDate';
import { ORDER_STATUS_LABELS } from '@/lib/constants/orderStatuses';
import type { OrderStatusHistory } from '@/types';

export function OrderTimeline({ history }: { history: OrderStatusHistory[] }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Timeline</h3>
      <ol className="relative border-l border-[var(--border)] ml-3 space-y-4">
        {history.map((entry, i) => {
          const isLatest = i === history.length - 1;
          return (
            <li key={i} className="ml-4">
              <span className={`absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full ring-2 ring-[var(--surface)] ${isLatest ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {ORDER_STATUS_LABELS[entry.status]}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {formatDateTime(entry.changed_at)}
                  {entry.changed_by_name && ` · ${entry.changed_by_name}`}
                </p>
                {entry.note && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)] italic">"{entry.note}"</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
