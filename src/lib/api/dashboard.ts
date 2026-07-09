import { get } from './client';
import type { DashboardStats } from '@/types';

interface RawDashboardStats extends Omit<DashboardStats, 'revenue_today' | 'revenue_sparkline'> {
  revenue_today: string | number;
  revenue_sparkline: (string | number)[];
}

function normaliseStats(raw: RawDashboardStats): DashboardStats {
  return {
    ...raw,
    revenue_today: Number(raw.revenue_today) || 0,
    revenue_sparkline: raw.revenue_sparkline.map((v) => Number(v) || 0),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const data = await get<{ stats: RawDashboardStats }>('/admin/dashboard');
  return normaliseStats(data.stats);
}

export interface RevenueChartPoint {
  date: string;
  value: number;
}

interface RawRevenueChartPoint {
  date: string;
  value: string | number;
}

export async function getRevenueChart(period: '7d' | '30d' | '3m' | '1y'): Promise<RevenueChartPoint[]> {
  const data = await get<RawRevenueChartPoint[]>('/admin/dashboard/revenue-chart', { period });
  return data.map((pt) => ({ date: pt.date, value: Number(pt.value) || 0 }));
}

export interface RecentOrderFeedItem {
  id: string;
  order_number: string;
  customer_name: string;
  amount: number;
  status: string;
  created_at: string;
}

interface RawRecentOrderFeedItem {
  id: number | string;
  order_number: string;
  customer_name: string;
  amount: string | number;
  status: string;
  created_at: string;
}

export async function getRecentOrders(): Promise<RecentOrderFeedItem[]> {
  const data = await get<RawRecentOrderFeedItem[]>('/admin/dashboard/recent-orders');
  return data.map((o) => ({
    id: String(o.id),
    order_number: o.order_number,
    customer_name: o.customer_name,
    amount: Number(o.amount) || 0,
    status: o.status,
    created_at: o.created_at,
  }));
}

export interface TopProductItem {
  id: string;
  name: string;
  revenue: number;
  orders: number;
}

interface RawTopProductItem {
  id: number | string;
  name: string;
  revenue: string | number;
  orders: number;
}

export async function getTopProducts(): Promise<TopProductItem[]> {
  const data = await get<RawTopProductItem[]>('/admin/dashboard/top-products');
  return data.map((p) => ({
    id: String(p.id),
    name: p.name,
    revenue: Number(p.revenue) || 0,
    orders: p.orders,
  }));
}

export interface OrderStatusBreakdownItem {
  status: string;
  count: number;
  color: string;
}

export async function getOrderStatusBreakdown(): Promise<OrderStatusBreakdownItem[]> {
  return get<OrderStatusBreakdownItem[]>('/admin/dashboard/order-status-breakdown');
}
