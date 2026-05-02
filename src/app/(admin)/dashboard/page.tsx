'use client';

import { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsRow } from '@/features/dashboard/components/StatsRow';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { OrderStatusBreakdown } from '@/features/dashboard/components/OrderStatusBreakdown';
import { RecentOrdersFeed } from '@/features/dashboard/components/RecentOrdersFeed';
import { TopProducts } from '@/features/dashboard/components/TopProducts';
import { AlertsPanel } from '@/features/dashboard/components/AlertsPanel';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { formatDateTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, dataUpdatedAt, isFetching } = useDashboardStats();

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['recent-orders-feed'] });
    queryClient.invalidateQueries({ queryKey: ['order-status-breakdown'] });
    queryClient.invalidateQueries({ queryKey: ['top-products'] });
  }, [queryClient]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your business."
        actions={
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-[var(--text-muted)] hidden sm:block">
                Updated {formatDateTime(new Date(dataUpdatedAt))}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </button>
          </div>
        }
      />

      {/* Section 1 — Stats */}
      <StatsRow stats={stats} isLoading={isLoading} />

      {/* Section 2 — Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <div className="xl:col-span-1">
          <OrderStatusBreakdown />
        </div>
      </div>

      {/* Section 3 — Feeds */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1">
          <RecentOrdersFeed />
        </div>
        <div className="xl:col-span-1">
          <TopProducts />
        </div>
        <div className="xl:col-span-1">
          <AlertsPanel alerts={stats?.alerts} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
