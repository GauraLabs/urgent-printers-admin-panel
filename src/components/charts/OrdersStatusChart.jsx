/**
 * Orders Status Chart Component
 * Pie chart showing order distribution by status
 */

import { PieChart } from '@mui/x-charts/PieChart';
import { useTheme } from '@mui/material/styles';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending: '#f59e0b',
  payment_pending: '#f97316',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  dispatched: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

const OrdersStatusChart = ({ data, loading = false, className }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <div className={cn('flex h-80 items-center justify-center rounded-xl border border-border bg-card', className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={cn('flex h-80 items-center justify-center rounded-xl border border-border bg-card', className)}>
        <p className="text-muted-foreground">No order data available</p>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([status, value], index) => ({
      id: index,
      value: value,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      color: STATUS_COLORS[status] || '#6b7280',
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Orders by Status</h3>
        <p className="text-sm text-muted-foreground">
          Total: {total.toLocaleString()} orders
        </p>
      </div>

      <div className="flex flex-col items-center lg:flex-row lg:items-start lg:gap-8">
        <PieChart
          series={[
            {
              data: chartData,
              innerRadius: 50,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { faded: 'global', highlighted: 'item' },
            },
          ]}
          height={220}
          width={220}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 lg:mt-0 lg:flex-col">
          {chartData.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm font-medium text-card-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersStatusChart;
