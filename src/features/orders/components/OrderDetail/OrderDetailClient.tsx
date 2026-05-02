'use client';

import Link from 'next/link';
import { ArrowLeft, Ticket } from 'lucide-react';
import { useOrderDetail } from '../../hooks/useOrderDetail';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderActions } from './OrderActions';
import { OrderTimeline } from './OrderTimeline';
import { OrderItems } from './OrderItems';
import { OrderCustomer } from './OrderCustomer';
import { OrderPayment } from './OrderPayment';
import { OrderShipping } from './OrderShipping';
import { OrderNotes } from './OrderNotes';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ROUTES } from '@/lib/constants/routes';
import type { OrderStatus } from '@/types';

export function OrderDetailClient({ id }: { id: string }) {
  const { data: order, isLoading, isError } = useOrderDetail(id);

  if (isLoading) return <PageSkeleton />;

  if (isError || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--text-secondary)]">Order not found.</p>
        <Link href={ROUTES.ORDERS} className="mt-3 inline-block text-sm text-[var(--primary)] hover:underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`${order.customer_name} · ${formatPrice(order.total_amount)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status as OrderStatus} />
            <Link
              href={ROUTES.ORDERS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Orders
            </Link>
          </div>
        }
      />

      {/* Actions bar */}
      <OrderActions order={order} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left — wider */}
        <div className="xl:col-span-2 space-y-4">
          <OrderTimeline history={order.status_history} />
          <OrderItems items={order.items} />
        </div>

        {/* Right — narrower */}
        <div className="space-y-4">
          <OrderCustomer
            customer_id={order.customer_id}
            customer_name={order.customer_name}
            customer_email={order.customer_email}
            customer_phone={order.customer_phone}
            customer_total_orders={order.customer_total_orders}
          />
          <OrderPayment payment={order.payment} />
          <OrderShipping address={order.shipping_address} shipping={order.shipping} />

          {order.coupon_code && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Coupon Applied</h3>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-[var(--primary)]" />
                <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{order.coupon_code}</span>
              </div>
              {order.coupon_discount_type && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {order.coupon_discount_type === 'percentage'
                    ? `${order.coupon_discount_value}% off`
                    : `${formatPrice(order.coupon_discount_value ?? 0)} off`}
                  {' · '}Saved {formatPrice(order.discount_amount)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4">
        <OrderNotes orderId={order.id} notes={order.notes} />
      </div>
    </div>
  );
}
