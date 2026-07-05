import type { DashboardStats } from '@/types';

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay();
  return {
    revenue_today: 284500,
    revenue_today_change_pct: 12.4,
    orders_today: 34,
    orders_today_change_pct: 8.2,
    active_orders: 127,
    pending_artwork_approval: 18,
    new_customers_today: 9,
    new_customers_change_pct: -3.1,
    failed_payments_today: 2,
    revenue_sparkline: [180000, 220000, 195000, 260000, 310000, 245000, 284500],
    orders_sparkline: [22, 28, 25, 31, 38, 30, 34],
    alerts: [
      {
        id: 'a1',
        type: 'artwork_pending',
        severity: 'warning',
        title: '18 orders awaiting artwork approval',
        description: '6 have been waiting over 24 hours',
        entity_id: '',
        entity_type: 'order',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
      {
        id: 'a2',
        type: 'failed_payment',
        severity: 'error',
        title: '2 failed payments today',
        description: 'Total value ₹8,400',
        entity_id: '',
        entity_type: 'payment',
        created_at: new Date().toISOString(),
      },
      {
        id: 'a3',
        type: 'order_stuck',
        severity: 'warning',
        title: 'ORD-2847 stuck in Printing',
        description: 'Order has been in Printing status for 48 hours',
        entity_id: 'ord-2847',
        entity_type: 'order',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
    ],
  };
}

export async function getRevenueChart(period: '7d' | '30d' | '3m' | '1y') {
  await delay();
  const points = period === '7d' ? 7 : period === '30d' ? 30 : period === '3m' ? 12 : 12;
  return Array.from({ length: points }, (_, i) => ({
    date: new Date(Date.now() - (points - i) * (period === '7d' ? 86400000 : period === '30d' ? 86400000 : period === '3m' ? 86400000 * 7 : 86400000 * 30)).toISOString(),
    value: Math.floor(150000 + Math.random() * 200000),
  }));
}

export async function getRecentOrders() {
  await delay(200);
  const statuses = ['placed', 'confirmed', 'printing', 'shipped', 'delivered'];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `ord-${2900 - i}`,
    order_number: `ORD-${2900 - i}`,
    customer_name: ['Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel', 'Vikram Rao', 'Neha Gupta', 'Arjun Mehta', 'Kavita Joshi', 'Suresh Iyer', 'Deepa Nair'][i],
    amount: Math.floor(2000 + Math.random() * 15000),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
  }));
}

export async function getTopProducts() {
  await delay(200);
  return [
    { id: 'p1', name: 'Business Cards', revenue: 84000, orders: 142 },
    { id: 'p2', name: 'Flyers A5', revenue: 62000, orders: 98 },
    { id: 'p3', name: 'Brochures A4', revenue: 54000, orders: 71 },
    { id: 'p4', name: 'Banners 4x2', revenue: 41000, orders: 34 },
    { id: 'p5', name: 'Visiting Cards Premium', revenue: 37000, orders: 89 },
  ];
}

export async function getOrderStatusBreakdown() {
  await delay(300);
  return [
    { status: 'Delivered', count: 698, color: '#22c55e' },
    { status: 'Dispatched', count: 82, color: '#3b82f6' },
    { status: 'Printing', count: 33, color: '#6366f1' },
    { status: 'Artwork Pending', count: 18, color: '#f97316' },
    { status: 'Confirmed', count: 14, color: '#0ea5e9' },
    { status: 'Cancelled', count: 34, color: '#ef4444' },
    { status: 'Pending', count: 8, color: '#94a3b8' },
  ];
}
