'use client';

import { useSalesReport } from '../hooks/useReports';
import { StatCards } from './StatCards';
import { ChartCard, TrendChart, HBarChart, DonutChart } from './ReportChart';
import { formatPrice } from '@/lib/utils/formatPrice';

interface Props { from: string; to: string }

export function SalesReport({ from, to }: Props) {
  const { data, isLoading } = useSalesReport(from, to);

  const stats = data ? [
    { label: 'Total Revenue', value: formatPrice(data.summary.total_revenue), change: data.summary.revenue_change_pct, sub: 'vs prev period' },
    { label: 'Total Orders', value: data.summary.total_orders.toLocaleString(), change: data.summary.orders_change_pct, sub: 'vs prev period' },
    { label: 'Avg. Order Value', value: formatPrice(data.summary.avg_order_value), sub: 'per transaction' },
  ] : [];

  return (
    <div className="space-y-5">
      <StatCards cards={stats} isLoading={isLoading} cols={3} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Revenue Over Time" subtitle="Daily revenue" isLoading={isLoading} height={220}>
          <TrendChart
            data={data?.revenue_over_time.map((d) => ({ date: d.date, value: d.value })) ?? []}
            formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
        </ChartCard>

        <ChartCard title="Avg. Order Value Trend" isLoading={isLoading} height={220}>
          <TrendChart
            data={data?.avg_order_value_trend.map((d) => ({ date: d.date, value: d.value })) ?? []}
            color="#22c55e"
            formatValue={(v) => `₹${(v / 1000).toFixed(1)}k`}
          />
        </ChartCard>

        <ChartCard title="Revenue by Category" isLoading={isLoading} height={220}>
          <HBarChart
            data={data?.revenue_by_category.map((d) => ({ name: d.category, value: d.revenue })) ?? []}
            formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
        </ChartCard>

        <ChartCard title="Payment Method Breakdown" isLoading={isLoading} height={220}>
          <DonutChart
            data={data?.payment_method_breakdown.map((d) => ({ name: d.method, value: d.count })) ?? []}
          />
        </ChartCard>
      </div>

      {/* Top products table */}
      {data && data.revenue_by_product.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[13px] font-semibold text-foreground">Top Products by Revenue</p>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {['Product', 'Orders', 'Revenue'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.revenue_by_product.map((r) => (
                <tr key={r.product} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium text-foreground">{r.product}</td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{r.orders}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold text-foreground">{formatPrice(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
