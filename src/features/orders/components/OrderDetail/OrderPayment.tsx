import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { CreditCard, Hash, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import type { OrderPaymentInfo } from '@/types';

export function OrderPayment({ payment }: { payment: OrderPaymentInfo }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Payment</h3>
        <PaymentStatusBadge status={payment.status} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)] flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Method
          </span>
          <span className="font-medium text-[var(--text-primary)]">{payment.method} · {payment.provider}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)] flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" /> Transaction
          </span>
          <span className="font-mono text-[11px] text-[var(--text-secondary)] truncate max-w-[120px]" title={payment.transaction_id}>
            {payment.transaction_id}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-muted)]">Amount</span>
          <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatPrice(payment.amount)}</span>
        </div>
        {payment.paid_at && (
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Paid at
            </span>
            <span className="text-[var(--text-secondary)]">{formatDateTime(payment.paid_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
