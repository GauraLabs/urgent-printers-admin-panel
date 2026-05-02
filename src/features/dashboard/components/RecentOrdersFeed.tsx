'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useRecentOrders } from '../hooks/useDashboardStats';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatTimeAgo } from '@/lib/utils/formatDate';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';
import type { OrderStatus } from '@/types';

export function RecentOrdersFeed() {
  const { data: orders, isLoading } = useRecentOrders();

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Orders</h3>
          <p className="text-xs text-[var(--text-muted)]">Last 10 orders placed</p>
        </div>
        <Link
          href={ROUTES.ORDERS}
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="divide-y divide-[var(--border-subtle)]">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="px-4 py-2.5 flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-14" />
              </li>
            ))
          : orders?.map((order) => (
              <li key={order.id}>
                <Link
                  href={ROUTES.ORDER_DETAIL(order.id)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-secondary)] transition-colors text-xs"
                >
                  <span className="font-mono font-medium text-[var(--text-primary)] w-20 flex-shrink-0">
                    {order.order_number}
                  </span>
                  <span className="flex-1 truncate text-[var(--text-secondary)]">
                    {order.customer_name}
                  </span>
                  <StatusBadge status={order.status as OrderStatus} />
                  <span className="font-medium text-[var(--text-primary)] tabular-nums flex-shrink-0">
                    {formatPrice(order.amount)}
                  </span>
                  <span className="text-[var(--text-muted)] flex-shrink-0 w-16 text-right">
                    {formatTimeAgo(order.created_at)}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}
