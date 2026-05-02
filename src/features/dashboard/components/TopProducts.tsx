'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTopProducts } from '../hooks/useDashboardStats';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants/routes';

export function TopProducts() {
  const { data: products, isLoading } = useTopProducts();
  const maxRevenue = Math.max(...(products?.map((p) => p.revenue) ?? [1]));

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Products</h3>
          <p className="text-xs text-[var(--text-muted)]">By revenue this month</p>
        </div>
        <Link
          href={ROUTES.PRODUCTS}
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-0.5"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="divide-y divide-[var(--border-subtle)] px-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="py-3 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-20" />
              </li>
            ))
          : products?.map((product, i) => {
              const pct = (product.revenue / maxRevenue) * 100;
              return (
                <li key={product.id} className="py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-2">
                      <span className="text-[var(--text-muted)] tabular-nums w-3">{i + 1}</span>
                      {product.name}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">
                      {formatPrice(product.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {product.orders} orders
                  </p>
                </li>
              );
            })}
      </ul>
    </div>
  );
}
