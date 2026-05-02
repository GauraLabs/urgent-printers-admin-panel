'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useCouponAnalytics } from '../hooks/useCoupons';
import { formatPrice } from '@/lib/utils/formatPrice';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface-secondary)] rounded-lg p-3 text-center">
      <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{value}</p>
      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{label}</p>
    </div>
  );
}

export function CouponAnalytics({ couponId }: { couponId: string }) {
  const { data, isLoading } = useCouponAnalytics(couponId);

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (!data) return null;

  const chartData = data.uses_over_time.map((d) => ({
    date: format(parseISO(d.date), 'd MMM'),
    Uses: d.uses,
    Discount: d.discount,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Uses" value={String(data.total_uses)} />
        <StatCard label="Unique Customers" value={String(data.unique_customers)} />
        <StatCard label="Avg. Order Value" value={formatPrice(data.avg_order_value)} />
        <StatCard label="Total Discount Given" value={formatPrice(data.total_discount_given)} />
        <StatCard label="Total Revenue" value={formatPrice(data.total_order_revenue)} />
        <StatCard label="Discount Rate" value={`${((data.total_discount_given / data.total_order_revenue) * 100).toFixed(1)}%`} />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-4">Usage Over Time (last 30 days)</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [String(value ?? 0), '']}
              />
              <Bar dataKey="Uses" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
