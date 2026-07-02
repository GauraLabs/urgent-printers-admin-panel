'use client';

import Link from 'next/link';
import { ArrowLeft, PackageX, Ticket } from 'lucide-react';
import { useOrderDetail } from '../../hooks/useOrderDetail';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderActions } from './OrderActions';
import { OrderTimeline } from './OrderTimeline';
import { OrderProofs } from './OrderProofs';
import { OrderItems } from './OrderItems';
import { OrderCustomer } from './OrderCustomer';
import { OrderPayment } from './OrderPayment';
import { OrderShipping } from './OrderShipping';
import { OrderNotes } from './OrderNotes';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { formatPrice } from '@/lib/utils/formatPrice';
import { ROUTES } from '@/lib/constants/routes';
import type { ApiError, OrderStatus } from '@/types';

export function OrderDetailClient({ id }: { id: string }) {
  const { data: order, isLoading, error } = useOrderDetail(id);

  if (isLoading) return <PageSkeleton />;

  const apiError = error as ApiError | null;
  const isNotFound = apiError?.status === 404;

  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageX className="h-12 w-12 text-[var(--text-muted)] mb-4" />
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Order not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          No order with ID <span className="font-mono">{id}</span> exists.
        </p>
        <Link
          href={ROUTES.ORDERS}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-[var(--danger)] mb-4">
          {apiError?.message ?? 'Failed to load order. Please try again.'}
        </p>
        <Link
          href={ROUTES.ORDERS}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

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

      <OrderActions order={order} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <OrderTimeline history={order.status_history} />
          {!['printing', 'shipped', 'delivered', 'cancelled', 'refund_initiated', 'refunded'].includes(order.status) && (
            <OrderProofs order={order} />
          )}
          <OrderItems items={order.items} />
        </div>

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
              {order.discount_amount > 0 && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Saved {formatPrice(order.discount_amount)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <OrderNotes orderId={order.id} notes={order.notes} />
      </div>
    </div>
  );
}
