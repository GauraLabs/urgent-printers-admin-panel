import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCustomerOrders } from '../../hooks/useCustomers';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDate } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import type { OrderStatus } from '@/types';

export function CustomerOrders({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerOrders(customerId);

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const orders = data?.items ?? [];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Order History <span className="text-[var(--text-muted)] font-normal">({data?.total ?? 0})</span>
        </p>
        <Link href={ROUTES.ORDERS} className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5">
          All orders <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="px-4 py-8 text-sm text-center text-[var(--text-muted)]">No orders yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)]">
              {['Order', 'Status', 'Type', 'Amount', 'Date'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase text-[10px] tracking-wide text-[var(--text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[var(--surface-secondary)] transition-colors">
                <td className="px-4 py-2.5">
                  <Link href={ROUTES.ORDER_DETAIL(order.id)} className="font-mono font-semibold text-[var(--primary)] hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-2.5"><StatusBadge status={order.status as OrderStatus} /></td>
                <td className="px-4 py-2.5 capitalize text-[var(--text-secondary)]">{order.turnaround}</td>
                <td className="px-4 py-2.5 font-medium tabular-nums">{formatPrice(order.total_amount)}</td>
                <td className="px-4 py-2.5 text-[var(--text-muted)]">{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
