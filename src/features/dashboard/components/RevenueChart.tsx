'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useRevenueChart, type RevenuePeriod } from '../hooks/useDashboardStats';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

const PERIODS: { label: string; value: RevenuePeriod }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
];

function formatXLabel(dateStr: string, period: RevenuePeriod) {
  try {
    const d = parseISO(dateStr);
    if (period === '7d') return format(d, 'EEE');
    if (period === '30d') return format(d, 'd MMM');
    return format(d, 'MMM');
  } catch {
    return '';
  }
}

export function RevenueChart() {
  const [period, setPeriod] = useState<RevenuePeriod>('30d');
  const { data, isLoading } = useRevenueChart(period);

  const chartData = data?.map((pt) => ({
    date: pt.date,
    Revenue: pt.value,
  })) ?? [];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Revenue</h3>
          <p className="text-xs text-[var(--text-muted)]">Daily revenue over selected period</p>
        </div>
        <div className="flex items-center gap-1 bg-[var(--surface-secondary)] rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                period === p.value
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatXLabel(v, period)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
                formatter={(value) => [formatPrice(Number(value ?? 0)), 'Revenue']}
                labelFormatter={(label) => formatXLabel(label, period)}
              />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#revenue-grad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
