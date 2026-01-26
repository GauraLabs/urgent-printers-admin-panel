/**
 * Revenue Chart Component
 * Line chart showing revenue over time using MUI X Charts
 */

import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';
import { cn } from '@/lib/utils';

const RevenueChart = ({ data, period = 'daily', loading = false, className }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <div className={cn('flex h-80 items-center justify-center rounded-xl border border-border bg-card', className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex h-80 items-center justify-center rounded-xl border border-border bg-card', className)}>
        <p className="text-muted-foreground">No revenue data available</p>
      </div>
    );
  }

  const xAxisData = data.map((d) => {
    const date = new Date(d.date);
    return period === 'monthly'
      ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  });

  const revenueData = data.map((d) => d.revenue);
  const ordersData = data.map((d) => d.orders);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Revenue Overview</h3>
        <p className="text-sm text-muted-foreground">
          {period === 'daily' ? 'Last 30 days' : 'Last 12 months'}
        </p>
      </div>

      <LineChart
        xAxis={[
          {
            data: xAxisData,
            scaleType: 'band',
            tickLabelStyle: {
              fontSize: 11,
              fill: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
            },
          },
        ]}
        series={[
          {
            data: revenueData,
            label: 'Revenue (₹)',
            color: '#3b82f6',
            curve: 'linear',
            showMark: false,
            area: true,
          },
        ]}
        height={300}
        margin={{ left: 70, right: 20, top: 20, bottom: 30 }}
        sx={{
          '.MuiLineElement-root': {
            strokeWidth: 2,
          },
          '.MuiAreaElement-root': {
            fillOpacity: 0.1,
          },
          '.MuiChartsAxis-tickLabel': {
            fill: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
          },
          '.MuiChartsAxis-line': {
            stroke: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
          },
          '.MuiChartsAxis-tick': {
            stroke: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
          },
        }}
        slotProps={{
          legend: {
            hidden: true,
          },
        }}
      />
    </div>
  );
};

export default RevenueChart;
