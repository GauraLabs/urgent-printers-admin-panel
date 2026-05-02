'use client';

import { useOrdersReport } from '../hooks/useReports';
import { StatCards } from './StatCards';
import { ChartCard, TrendChart, DonutChart } from './ReportChart';

interface Props { from: string; to: string }

export function OrdersReport({ from, to }: Props) {
  const { data, isLoading } = useOrdersReport(from, to);

  const stats = data ? [
    { label: 'Total Orders', value: data.summary.total_orders.toLocaleString() },
    { label: 'Cancellation Rate', value: `${data.summary.cancellation_rate.toFixed(1)}%`, sub: `${data.summary.cancelled_orders} cancelled` },
    { label: 'Avg. Fulfillment', value: `${data.summary.avg_fulfillment_hours.toFixed(1)}h`, sub: 'from confirmed to dispatch' },
    { label: 'Avg. Delivery', value: `${data.summary.avg_delivery_days.toFixed(1)} days`, sub: 'from dispatch to delivered' },
  ] : [];

  return (
    <div className="space-y-5">
      <StatCards cards={stats} isLoading={isLoading} cols={4} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Order Volume Over Time" subtitle="Daily orders" isLoading={isLoading} height={220}>
          <TrendChart
            data={data?.orders_over_time.map((d) => ({ date: d.date, value: d.value })) ?? []}
            color="#3b82f6"
          />
        </ChartCard>

        <ChartCard title="Cancellation Rate Trend" subtitle="% of orders cancelled" isLoading={isLoading} height={220}>
          <TrendChart
            data={data?.cancellation_rate_trend.map((d) => ({ date: d.date, value: d.value })) ?? []}
            color="#ef4444"
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
        </ChartCard>

        <ChartCard title="Orders by Status" isLoading={isLoading} height={240}>
          <DonutChart
            data={data?.orders_by_status.map((d) => ({ name: d.status, value: d.count })) ?? []}
          />
        </ChartCard>

        <ChartCard title="Fulfillment Time Trend" subtitle="Hours from confirmed to dispatched" isLoading={isLoading} height={240}>
          <TrendChart
            data={data?.fulfillment_time_trend.map((d) => ({ date: d.date, value: d.value })) ?? []}
            color="#f97316"
            formatValue={(v) => `${v.toFixed(0)}h`}
          />
        </ChartCard>
      </div>
    </div>
  );
}
