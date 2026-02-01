/**
 * Dashboard Page
 * Main dashboard with stats, charts, and recent activity
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetDashboardStatsQuery,
  useGetRevenueChartQuery,
  useGetOrdersByStatusQuery,
  useGetTopProductsQuery,
  useGetRecentOrdersQuery,
} from '@/store/api/apiSlice';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import RevenueChart from '@/components/charts/RevenueChart';
import OrdersStatusChart from '@/components/charts/OrdersStatusChart';
import TopProductsChart from '@/components/charts/TopProductsChart';
import { ROUTES } from '@/constants/routes';
import {
  ShoppingCart,
  IndianRupee,
  Users,
  Package,
  TrendingUp,
  ArrowRight,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Star,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [chartPeriod, setChartPeriod] = useState('daily');

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetDashboardStatsQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueChartQuery({
    period: chartPeriod,
    days: chartPeriod === 'daily' ? 30 : 365,
  });
  const { data: ordersByStatus, isLoading: ordersStatusLoading } = useGetOrdersByStatusQuery();
  const { data: topProducts, isLoading: topProductsLoading } = useGetTopProductsQuery(10);
  const { data: recentOrders, isLoading: recentOrdersLoading } = useGetRecentOrdersQuery(5);

  const handleRefresh = () => {
    refetchStats();
  };

  // Mock stats data for demo (remove when API is connected)
  const mockStats = {
    total_orders: 1234,
    orders_today: 23,
    orders_this_week: 156,
    orders_this_month: 542,
    revenue_today: 45680,
    revenue_this_week: 312450,
    revenue_this_month: 1245680,
    total_revenue: 8956320,
    total_users: 3456,
    new_users_today: 12,
    new_users_this_week: 89,
    total_products: 312,
    active_products: 245,
    inactive_products: 67,
    featured_products: 18,
    low_stock_products: 8,
    total_categories: 24,
    total_tags: 45,
    pending_orders: 34,
    processing_orders: 67,
  };

  const displayStats = stats || mockStats;

  // Mock recent orders for demo
  const mockRecentOrders = [
    { id: 1, order_number: 'ORD-2024-1234', customer_name: 'Rahul Sharma', total: 4500, status: 'confirmed', created_at: '2024-01-25T10:30:00' },
    { id: 2, order_number: 'ORD-2024-1233', customer_name: 'Priya Patel', total: 2350, status: 'processing', created_at: '2024-01-25T09:15:00' },
    { id: 3, order_number: 'ORD-2024-1232', customer_name: 'Amit Kumar', total: 8900, status: 'dispatched', created_at: '2024-01-24T16:45:00' },
    { id: 4, order_number: 'ORD-2024-1231', customer_name: 'Sneha Gupta', total: 1200, status: 'delivered', created_at: '2024-01-24T14:20:00' },
    { id: 5, order_number: 'ORD-2024-1230', customer_name: 'Vikram Singh', total: 6750, status: 'pending', created_at: '2024-01-24T11:00:00' },
  ];

  const displayRecentOrders = recentOrders?.orders || mockRecentOrders;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your business."
      >
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={displayStats.total_orders}
          icon={ShoppingCart}
          trend="up"
          trendValue={12}
          trendLabel="vs last month"
          loading={statsLoading}
        />
        <StatCard
          title="Revenue Today"
          value={displayStats.revenue_today}
          valuePrefix="₹"
          icon={IndianRupee}
          trend="up"
          trendValue={8}
          trendLabel="vs yesterday"
          loading={statsLoading}
        />
        <StatCard
          title="Total Users"
          value={displayStats.total_users}
          icon={Users}
          trend="up"
          trendValue={5}
          trendLabel="vs last month"
          loading={statsLoading}
        />
        <StatCard
          title="Active Products"
          value={displayStats.active_products}
          icon={Package}
          trend="neutral"
          trendValue={0}
          trendLabel="no change"
          loading={statsLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to={ROUTES.PRODUCTS} className="group">
          <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Featured Products</p>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{displayStats.featured_products || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary">View all products →</p>
          </div>
        </Link>
        <Link to={ROUTES.PRODUCTS} className="group">
          <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-destructive/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Low Stock Alert</p>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-2 text-2xl font-bold text-destructive">{displayStats.low_stock_products || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground group-hover:text-destructive">Check inventory →</p>
          </div>
        </Link>
        <Link to={ROUTES.CATEGORIES} className="group">
          <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Categories</p>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{displayStats.total_categories || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary">Manage categories →</p>
          </div>
        </Link>
        <Link to={ROUTES.TAGS} className="group">
          <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Product Tags</p>
              <Tag className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{displayStats.total_tags || 0}</p>
            <p className="mt-1 text-xs text-muted-foreground group-hover:text-primary">Manage tags →</p>
          </div>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="font-semibold text-card-foreground">Revenue Overview</h3>
              <p className="text-sm text-muted-foreground">
                {chartPeriod === 'daily' ? 'Last 30 days' : 'Last 12 months'}
              </p>
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setChartPeriod('daily')}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  chartPeriod === 'daily'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Daily
              </button>
              <button
                onClick={() => setChartPeriod('monthly')}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                  chartPeriod === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="p-4">
            <RevenueChart
              data={revenueData?.data || [
                { date: '2024-01-01', revenue: 45000, orders: 12 },
                { date: '2024-01-02', revenue: 52000, orders: 15 },
                { date: '2024-01-03', revenue: 38000, orders: 10 },
                { date: '2024-01-04', revenue: 61000, orders: 18 },
                { date: '2024-01-05', revenue: 55000, orders: 16 },
                { date: '2024-01-06', revenue: 48000, orders: 14 },
                { date: '2024-01-07', revenue: 72000, orders: 22 },
              ]}
              period={chartPeriod}
              loading={revenueLoading}
              className="border-0 p-0"
            />
          </div>
        </div>

        {/* Orders by Status */}
        <OrdersStatusChart
          data={ordersByStatus || {
            pending: 34,
            confirmed: 45,
            processing: 67,
            dispatched: 28,
            delivered: 890,
            cancelled: 23,
          }}
          loading={ordersStatusLoading}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <TopProductsChart
          data={topProducts || [
            { name: 'Business Cards - Premium', total_quantity: 1250 },
            { name: 'Letterhead - Standard', total_quantity: 890 },
            { name: 'Brochure - Tri-fold', total_quantity: 650 },
            { name: 'Flyer - A4', total_quantity: 520 },
            { name: 'Poster - A3', total_quantity: 380 },
          ]}
          loading={topProductsLoading}
        />

        {/* Recent Orders */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="font-semibold text-card-foreground">Recent Orders</h3>
              <p className="text-sm text-muted-foreground">Latest customer orders</p>
            </div>
            <Link
              to={ROUTES.ORDERS}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {displayRecentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {order.customer_name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-card-foreground">₹{order.total?.toLocaleString()}</p>
                  <StatusBadge status={order.status} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
