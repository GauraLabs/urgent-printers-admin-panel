/**
 * Analytics Dashboard Page
 * Business analytics and reporting
 */

import { useState } from 'react';
import {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import RevenueChart from '@/components/charts/RevenueChart';
import { ROUTES } from '@/constants/routes';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  IndianRupee,
  Download,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('30d');

  const { data: stats, isLoading: statsLoading } = useGetDashboardStatsQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueChartQuery({
    period: 'daily',
    days: period === '7d' ? 7 : period === '30d' ? 30 : 90,
  });

  // Mock analytics data
  const mockMetrics = {
    totalRevenue: 8956320,
    revenueGrowth: 12.5,
    totalOrders: 1234,
    orderGrowth: 8.3,
    avgOrderValue: 7260,
    aovGrowth: 3.2,
    conversionRate: 4.5,
    conversionGrowth: 0.8,
  };

  const userGrowthData = [
    { month: 'Jan', newUsers: 120, activeUsers: 450 },
    { month: 'Feb', newUsers: 150, activeUsers: 520 },
    { month: 'Mar', newUsers: 180, activeUsers: 610 },
    { month: 'Apr', newUsers: 220, activeUsers: 750 },
    { month: 'May', newUsers: 190, activeUsers: 820 },
    { month: 'Jun', newUsers: 250, activeUsers: 950 },
  ];

  const categoryPerformance = [
    { category: 'Business Cards', revenue: 2500000, orders: 450 },
    { category: 'Brochures', revenue: 1800000, orders: 320 },
    { category: 'Flyers', revenue: 1200000, orders: 280 },
    { category: 'Letterheads', revenue: 900000, orders: 150 },
    { category: 'Posters', revenue: 750000, orders: 120 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Business performance insights"
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Analytics' },
        ]}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={mockMetrics.totalRevenue}
          valuePrefix="₹"
          icon={IndianRupee}
          trend={mockMetrics.revenueGrowth >= 0 ? 'up' : 'down'}
          trendValue={mockMetrics.revenueGrowth}
          loading={statsLoading}
        />
        <StatCard
          title="Total Orders"
          value={mockMetrics.totalOrders}
          icon={ShoppingCart}
          trend={mockMetrics.orderGrowth >= 0 ? 'up' : 'down'}
          trendValue={mockMetrics.orderGrowth}
          loading={statsLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={mockMetrics.avgOrderValue}
          valuePrefix="₹"
          icon={TrendingUp}
          trend={mockMetrics.aovGrowth >= 0 ? 'up' : 'down'}
          trendValue={mockMetrics.aovGrowth}
          loading={statsLoading}
        />
        <StatCard
          title="Conversion Rate"
          value={mockMetrics.conversionRate}
          valueSuffix="%"
          icon={Users}
          trend={mockMetrics.conversionGrowth >= 0 ? 'up' : 'down'}
          trendValue={mockMetrics.conversionGrowth}
          loading={statsLoading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Revenue Trend</h3>
        <RevenueChart
          data={revenueData?.data || [
            { date: '2024-01-01', revenue: 245000, orders: 32 },
            { date: '2024-01-02', revenue: 312000, orders: 41 },
            { date: '2024-01-03', revenue: 278000, orders: 36 },
            { date: '2024-01-04', revenue: 421000, orders: 55 },
            { date: '2024-01-05', revenue: 389000, orders: 48 },
            { date: '2024-01-06', revenue: 356000, orders: 44 },
            { date: '2024-01-07', revenue: 498000, orders: 62 },
          ]}
          loading={revenueLoading}
          className="border-0 p-0"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">User Growth</h3>
          <LineChart
            xAxis={[{ data: userGrowthData.map(d => d.month), scaleType: 'band' }]}
            series={[
              { data: userGrowthData.map(d => d.newUsers), label: 'New Users', color: '#3b82f6' },
              { data: userGrowthData.map(d => d.activeUsers), label: 'Active Users', color: '#22c55e' },
            ]}
            height={300}
            margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
          />
        </div>

        {/* Category Performance */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Top Categories</h3>
          <BarChart
            yAxis={[{ data: categoryPerformance.map(c => c.category), scaleType: 'band' }]}
            series={[{ data: categoryPerformance.map(c => c.revenue / 100000), color: '#8b5cf6' }]}
            layout="horizontal"
            height={300}
            margin={{ left: 100, right: 20, top: 20, bottom: 30 }}
          />
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Category Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Revenue</th>
                <th className="p-4 text-right">Orders</th>
                <th className="p-4 text-right">Avg Order</th>
                <th className="p-4 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {categoryPerformance.map((cat, index) => {
                const totalRevenue = categoryPerformance.reduce((sum, c) => sum + c.revenue, 0);
                const percentage = ((cat.revenue / totalRevenue) * 100).toFixed(1);
                const avgOrder = Math.round(cat.revenue / cat.orders);

                return (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{cat.category}</td>
                    <td className="p-4 text-right">₹{(cat.revenue / 100000).toFixed(1)}L</td>
                    <td className="p-4 text-right">{cat.orders}</td>
                    <td className="p-4 text-right">₹{avgOrder.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-sm">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
