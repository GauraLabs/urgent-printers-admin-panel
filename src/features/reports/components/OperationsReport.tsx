'use client';

import { useOperationsReport } from '../hooks/useReports';
import { StatCards } from './StatCards';
import { ChartCard, TrendChart, HBarChart, DonutChart, GroupBarChart, isHourlySeries, formatChartDate } from './ReportChart';

interface Props { from: string; to: string }

export function OperationsReport({ from, to }: Props) {
  const { data, isLoading } = useOperationsReport(from, to);

  const stats = data ? [
    { label: 'Avg. Production Time', value: `${data.summary.avg_production_hours.toFixed(1)}h` },
    { label: 'Rush Orders', value: `${data.summary.rush_order_pct.toFixed(1)}%` },
    { label: 'Express Orders', value: `${data.summary.express_order_pct.toFixed(1)}%` },
    { label: 'Artwork Reupload Rate', value: `${data.summary.artwork_reupload_rate.toFixed(1)}%` },
  ] : [];

  const turnaroundHourly = isHourlySeries(data?.orders_by_turnaround_over_time.map((d) => d.date) ?? []);
  const turnaroundByTime = data?.orders_by_turnaround_over_time.map((d) => ({
    name: formatChartDate(d.date, turnaroundHourly),
    Standard: d.standard,
    Express: d.express,
    Rush: d.rush,
  })) ?? [];

  return (
    <div className="space-y-5">
      <StatCards cards={stats} isLoading={isLoading} cols={4} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Production Time by Product" subtitle="Average hours per product type" isLoading={isLoading} height={220}>
          <HBarChart
            data={data?.production_time_by_product.map((d) => ({ name: d.product, value: d.avg_hours })) ?? []}
            color="#f97316"
            formatValue={(v) => `${v.toFixed(0)}h`}
          />
        </ChartCard>

        <ChartCard title="Turnaround Distribution" subtitle="Order share by speed tier" isLoading={isLoading} height={220}>
          <DonutChart
            data={data?.turnaround_distribution.map((d) => ({ name: d.type, value: d.count })) ?? []}
          />
        </ChartCard>

        <ChartCard title="Artwork Reupload Rate" subtitle="% of orders requiring reupload" isLoading={isLoading} height={220}>
          <TrendChart
            data={data?.artwork_reupload_trend.map((d) => ({ date: d.date, value: d.value })) ?? []}
            color="#ef4444"
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
        </ChartCard>

        <ChartCard title="Orders by Turnaround Over Time" isLoading={isLoading} height={220}>
          <GroupBarChart
            data={turnaroundByTime.slice(-14)}
            keys={['Standard', 'Express', 'Rush']}
          />
        </ChartCard>
      </div>
    </div>
  );
}
