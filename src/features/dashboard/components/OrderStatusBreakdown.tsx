'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrderStatusBreakdown } from '../hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

export function OrderStatusBreakdown() {
  const { data, isLoading } = useOrderStatusBreakdown();
  const total = data?.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Order Status</h3>
        <p className="text-xs text-[var(--text-muted)]">Current distribution across all statuses</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-36 rounded-full mx-auto" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data?.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => {
                    const n = Number(value ?? 0);
                    return [`${n} (${((n / total) * 100).toFixed(1)}%)`, ''];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <ul className="space-y-1.5">
            {data?.map((d) => (
              <li key={d.status} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  {d.status}
                </span>
                <span className="font-medium text-[var(--text-primary)] tabular-nums">
                  {d.count}
                  <span className="text-[var(--text-muted)] font-normal ml-1">
                    ({((d.count / total) * 100).toFixed(0)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
