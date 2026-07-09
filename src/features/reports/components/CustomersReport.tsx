'use client';

import { useCustomersReport } from '../hooks/useReports';
import { StatCards } from './StatCards';
import { ChartCard, TrendChart, GroupBarChart, DonutChart, HBarChart, isHourlySeries, formatChartDate } from './ReportChart';
import { formatPrice } from '@/lib/utils/formatPrice';

interface Props { from: string; to: string }

export function CustomersReport({ from, to }: Props) {
  const { data, isLoading } = useCustomersReport(from, to);

  const stats = data ? [
    { label: 'New Customers', value: data.summary.total_new_customers.toLocaleString() },
    { label: 'Returning Customers', value: data.summary.returning_customers.toLocaleString() },
    { label: 'New/Returning Ratio', value: `${(data.summary.new_vs_returning_ratio * 100).toFixed(0)}% new` },
    { label: 'Avg. Lifetime Value', value: formatPrice(data.summary.avg_lifetime_value) },
  ] : [];

  const retVsNewHourly = isHourlySeries(data?.returning_vs_new.map((d) => d.date) ?? []);
  const retVsNew = data?.returning_vs_new.map((d) => ({
    name: formatChartDate(d.date, retVsNewHourly),
    new: d.new,
    returning: d.returning,
  })) ?? [];

  return (
    <div className="space-y-5">
      <StatCards cards={stats} isLoading={isLoading} cols={4} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="New Customers Over Time" isLoading={isLoading} height={220}>
          <TrendChart
            data={data?.new_customers_over_time.map((d) => ({ date: d.date, value: d.value })) ?? []}
            color="#8b5cf6"
          />
        </ChartCard>

        <ChartCard title="New vs Returning" subtitle="Daily comparison" isLoading={isLoading} height={220}>
          <GroupBarChart
            data={retVsNew.slice(-14)}
            keys={['new', 'returning']}
          />
        </ChartCard>

        <ChartCard title="Lifetime Value Distribution" isLoading={isLoading} height={220}>
          <DonutChart
            data={data?.lifetime_value_distribution.map((d) => ({ name: d.range, value: d.count })) ?? []}
          />
        </ChartCard>

        <ChartCard title="Customers by State" isLoading={isLoading} height={220}>
          <HBarChart
            data={data?.customers_by_state.map((d) => ({ name: d.state, value: d.count })) ?? []}
            color="#06b6d4"
          />
        </ChartCard>
      </div>
    </div>
  );
}
