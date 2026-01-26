/**
 * Top Products Chart Component
 * Horizontal bar chart showing best-selling products
 */

import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';
import { cn } from '@/lib/utils';

const TopProductsChart = ({ data, loading = false, className }) => {
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
        <p className="text-muted-foreground">No product data available</p>
      </div>
    );
  }

  const productNames = data.map((p) =>
    p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name
  );
  const quantities = data.map((p) => p.total_quantity || p.quantity || 0);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Top Selling Products</h3>
        <p className="text-sm text-muted-foreground">By quantity sold</p>
      </div>

      <BarChart
        xAxis={[
          {
            scaleType: 'band',
            data: productNames,
            tickLabelStyle: {
              fontSize: 11,
              fill: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
              angle: -45,
              textAnchor: 'end',
            },
          },
        ]}
        series={[
          {
            data: quantities,
            color: '#8b5cf6',
          },
        ]}
        height={280}
        margin={{ left: 50, right: 20, top: 20, bottom: 80 }}
        sx={{
          '.MuiChartsAxis-tickLabel': {
            fill: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
          },
          '.MuiChartsAxis-line': {
            stroke: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
          },
          '.MuiBarElement-root': {
            rx: 4,
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

export default TopProductsChart;
