import { get } from './client';
import type {
  SalesReportData,
  OrdersReportData,
  CustomersReportData,
  OperationsReportData,
  ChartDataPoint,
} from '@/types';

function toNum(v: string | number): number {
  return Number(v) || 0;
}

interface RawTimeSeriesPoint {
  date: string;
  value: string | number;
}

function toSeries(points: RawTimeSeriesPoint[]): ChartDataPoint[] {
  return points.map((p) => ({ date: p.date, value: toNum(p.value) }));
}

interface RawSalesReportData {
  summary: {
    total_revenue: string | number;
    total_orders: number;
    avg_order_value: string | number;
    revenue_change_pct: number;
    orders_change_pct: number;
  };
  revenue_over_time: RawTimeSeriesPoint[];
  revenue_by_category: Array<{ category: string; revenue: string | number; orders: number }>;
  revenue_by_product: Array<{ product: string; revenue: string | number; orders: number }>;
  avg_order_value_trend: RawTimeSeriesPoint[];
  payment_method_breakdown: Array<{ method: string; count: number; amount: string | number }>;
}

export async function getSalesReport(from: string, to: string): Promise<SalesReportData> {
  const data = await get<RawSalesReportData>('/admin/reports/sales', { from_date: from, to_date: to });
  return {
    summary: {
      ...data.summary,
      total_revenue: toNum(data.summary.total_revenue),
      avg_order_value: toNum(data.summary.avg_order_value),
    },
    revenue_over_time: toSeries(data.revenue_over_time),
    revenue_by_category: data.revenue_by_category.map((c) => ({ ...c, revenue: toNum(c.revenue) })),
    revenue_by_product: data.revenue_by_product.map((p) => ({ ...p, revenue: toNum(p.revenue) })),
    avg_order_value_trend: toSeries(data.avg_order_value_trend),
    payment_method_breakdown: data.payment_method_breakdown.map((m) => ({ ...m, amount: toNum(m.amount) })),
  };
}

interface RawOrdersReportData {
  summary: {
    total_orders: number;
    cancelled_orders: number;
    cancellation_rate: number;
    avg_fulfillment_hours: number;
    avg_delivery_days: number;
  };
  orders_over_time: RawTimeSeriesPoint[];
  cancellation_rate_trend: RawTimeSeriesPoint[];
  orders_by_status: Array<{ status: string; count: number }>;
  fulfillment_time_trend: RawTimeSeriesPoint[];
}

export async function getOrdersReport(from: string, to: string): Promise<OrdersReportData> {
  const data = await get<RawOrdersReportData>('/admin/reports/orders-analytics', { from_date: from, to_date: to });
  return {
    summary: data.summary,
    orders_over_time: toSeries(data.orders_over_time),
    cancellation_rate_trend: toSeries(data.cancellation_rate_trend),
    orders_by_status: data.orders_by_status,
    fulfillment_time_trend: toSeries(data.fulfillment_time_trend),
  };
}

interface RawCustomersReportData {
  summary: {
    total_new_customers: number;
    returning_customers: number;
    new_vs_returning_ratio: number;
    avg_lifetime_value: string | number;
  };
  new_customers_over_time: RawTimeSeriesPoint[];
  returning_vs_new: Array<{ date: string; new: number; returning: number }>;
  lifetime_value_distribution: Array<{ range: string; count: number }>;
  customers_by_state: Array<{ state: string; count: number; revenue: string | number }>;
}

export async function getCustomersReport(from: string, to: string): Promise<CustomersReportData> {
  const data = await get<RawCustomersReportData>('/admin/reports/customers-analytics', { from_date: from, to_date: to });
  return {
    summary: {
      ...data.summary,
      avg_lifetime_value: toNum(data.summary.avg_lifetime_value),
    },
    new_customers_over_time: toSeries(data.new_customers_over_time),
    returning_vs_new: data.returning_vs_new,
    lifetime_value_distribution: data.lifetime_value_distribution,
    customers_by_state: data.customers_by_state.map((s) => ({ ...s, revenue: toNum(s.revenue) })),
  };
}

interface RawOperationsReportData {
  summary: {
    avg_production_hours: number;
    rush_order_pct: number;
    express_order_pct: number;
    artwork_reupload_rate: number;
  };
  production_time_by_product: Array<{ product: string; avg_hours: number }>;
  turnaround_distribution: Array<{ type: string; count: number; pct: number }>;
  artwork_reupload_trend: RawTimeSeriesPoint[];
  orders_by_turnaround_over_time: Array<{ date: string; standard: number; express: number; rush: number }>;
}

export async function getOperationsReport(from: string, to: string): Promise<OperationsReportData> {
  const data = await get<RawOperationsReportData>('/admin/reports/operations', { from_date: from, to_date: to });
  return {
    summary: data.summary,
    production_time_by_product: data.production_time_by_product,
    turnaround_distribution: data.turnaround_distribution,
    artwork_reupload_trend: toSeries(data.artwork_reupload_trend),
    orders_by_turnaround_over_time: data.orders_by_turnaround_over_time,
  };
}
