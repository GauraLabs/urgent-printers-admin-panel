'use client';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Printer, ImageIcon, UserPlus, XCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types';

interface StatCardProps {
  label: string;
  value: string;
  changePct?: number;
  sparkline?: number[];
  sparkColor?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ label, value, changePct, sparkline, sparkColor = '#3b82f6', icon, iconBg }: StatCardProps) {
  const positive = changePct !== undefined && changePct >= 0;
  const sparkData = sparkline?.map((v, i) => ({ i, v }));

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">{value}</p>
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {changePct !== undefined ? (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(changePct).toFixed(1)}% vs yesterday
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Today</span>
        )}

        {sparkData && sparkData.length > 0 && (
          <div className="w-20 h-8 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  fill={`url(#grad-${label})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsRowProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function StatsRow({ stats, isLoading }: StatsRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      label: 'Revenue Today',
      value: formatPrice(stats?.revenue_today ?? 0),
      changePct: stats?.revenue_today_change_pct,
      sparkline: stats?.revenue_sparkline,
      sparkColor: '#22c55e',
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
      iconBg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Orders Today',
      value: String(stats?.orders_today ?? 0),
      changePct: stats?.orders_today_change_pct,
      sparkline: stats?.orders_sparkline,
      sparkColor: '#3b82f6',
      icon: <ShoppingCart className="h-4 w-4 text-blue-600" />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Active Orders',
      value: String(stats?.active_orders ?? 0),
      icon: <Printer className="h-4 w-4 text-indigo-600" />,
      iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: 'Artwork Pending',
      value: String(stats?.pending_artwork_approval ?? 0),
      icon: <ImageIcon className="h-4 w-4 text-orange-600" />,
      iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'New Customers',
      value: String(stats?.new_customers_today ?? 0),
      changePct: stats?.new_customers_change_pct,
      icon: <UserPlus className="h-4 w-4 text-purple-600" />,
      iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Failed Payments',
      value: String(stats?.failed_payments_today ?? 0),
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      iconBg: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
