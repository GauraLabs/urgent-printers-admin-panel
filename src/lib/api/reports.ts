import type { SalesReportData, OrdersReportData, CustomersReportData, OperationsReportData } from '@/types';

function delay(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

function makeSeries(days: number, base: number, variance: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
    value: Math.floor(base + Math.random() * variance),
  }));
}

export async function getSalesReport(from: string, to: string): Promise<SalesReportData> {
  await delay();
  return {
    summary: { total_revenue: 4284500, total_orders: 847, avg_order_value: 5059, revenue_change_pct: 14.2, orders_change_pct: 8.7 },
    revenue_over_time: makeSeries(30, 100000, 80000),
    revenue_by_category: [
      { category: 'Business Stationery', revenue: 1842000, orders: 412 },
      { category: 'Marketing Materials', revenue: 1240000, orders: 287 },
      { category: 'Signage', revenue: 842000, orders: 98 },
      { category: 'Stickers & Labels', revenue: 360500, orders: 50 },
    ],
    revenue_by_product: [
      { product: 'Business Cards Premium', revenue: 840000, orders: 142 },
      { product: 'Flyers A5 Gloss', revenue: 620000, orders: 98 },
      { product: 'Brochures A4 Trifold', revenue: 540000, orders: 71 },
    ],
    avg_order_value_trend: makeSeries(30, 4500, 2000),
    payment_method_breakdown: [
      { method: 'UPI', count: 412, amount: 2100000 },
      { method: 'Credit Card', count: 247, amount: 1540000 },
      { method: 'Net Banking', count: 188, amount: 644500 },
    ],
  };
}

export async function getOrdersReport(from: string, to: string): Promise<OrdersReportData> {
  await delay();
  return {
    summary: { total_orders: 847, cancelled_orders: 34, cancellation_rate: 4.01, avg_fulfillment_hours: 18.4, avg_delivery_days: 4.2 },
    orders_over_time: makeSeries(30, 25, 20),
    cancellation_rate_trend: makeSeries(30, 3.5, 3),
    orders_by_status: [
      { status: 'delivered', count: 698 },
      { status: 'dispatched', count: 82 },
      { status: 'printing', count: 33 },
      { status: 'cancelled', count: 34 },
    ],
    fulfillment_time_trend: makeSeries(30, 16, 8),
  };
}

export async function getCustomersReport(from: string, to: string): Promise<CustomersReportData> {
  await delay();
  return {
    summary: { total_new_customers: 284, returning_customers: 563, new_vs_returning_ratio: 0.335, avg_lifetime_value: 14240 },
    new_customers_over_time: makeSeries(30, 8, 12),
    returning_vs_new: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      new: Math.floor(5 + Math.random() * 15),
      returning: Math.floor(15 + Math.random() * 25),
    })),
    lifetime_value_distribution: [
      { range: '₹0–₹5k', count: 312 },
      { range: '₹5k–₹20k', count: 489 },
      { range: '₹20k–₹50k', count: 187 },
      { range: '₹50k+', count: 54 },
    ],
    customers_by_state: [
      { state: 'Karnataka', count: 412, revenue: 1840000 },
      { state: 'Maharashtra', count: 287, revenue: 1240000 },
      { state: 'Delhi', count: 198, revenue: 940000 },
      { state: 'Tamil Nadu', count: 145, revenue: 264500 },
    ],
  };
}

export async function getOperationsReport(from: string, to: string): Promise<OperationsReportData> {
  await delay();
  return {
    summary: { avg_production_hours: 18.4, rush_order_pct: 12.4, express_order_pct: 28.7, artwork_reupload_rate: 8.2 },
    production_time_by_product: [
      { product: 'Business Cards', avg_hours: 12 },
      { product: 'Flyers', avg_hours: 8 },
      { product: 'Brochures', avg_hours: 24 },
      { product: 'Banners', avg_hours: 36 },
    ],
    turnaround_distribution: [
      { type: 'standard', count: 512, pct: 60.4 },
      { type: 'express', count: 243, pct: 28.7 },
      { type: 'rush', count: 92, pct: 10.9 },
    ],
    artwork_reupload_trend: makeSeries(30, 5, 8),
    orders_by_turnaround_over_time: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      standard: Math.floor(10 + Math.random() * 20),
      express: Math.floor(4 + Math.random() * 12),
      rush: Math.floor(1 + Math.random() * 6),
    })),
  };
}
