export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ReportSummary {
  [key: string]: number | string;
}

export interface ReportData {
  summary: ReportSummary;
  series: ChartSeries[];
  table_data: Record<string, unknown>[];
  period_start: string;
  period_end: string;
}

export interface SalesReportData {
  summary: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    revenue_change_pct: number;
    orders_change_pct: number;
  };
  revenue_over_time: ChartDataPoint[];
  revenue_by_category: Array<{ category: string; revenue: number; orders: number }>;
  revenue_by_product: Array<{ product: string; revenue: number; orders: number }>;
  avg_order_value_trend: ChartDataPoint[];
  payment_method_breakdown: Array<{ method: string; count: number; amount: number }>;
}

export interface OrdersReportData {
  summary: {
    total_orders: number;
    cancelled_orders: number;
    cancellation_rate: number;
    avg_fulfillment_hours: number;
    avg_delivery_days: number;
  };
  orders_over_time: ChartDataPoint[];
  cancellation_rate_trend: ChartDataPoint[];
  orders_by_status: Array<{ status: string; count: number }>;
  fulfillment_time_trend: ChartDataPoint[];
}

export interface CustomersReportData {
  summary: {
    total_new_customers: number;
    returning_customers: number;
    new_vs_returning_ratio: number;
    avg_lifetime_value: number;
  };
  new_customers_over_time: ChartDataPoint[];
  returning_vs_new: Array<{ date: string; new: number; returning: number }>;
  lifetime_value_distribution: Array<{ range: string; count: number }>;
  customers_by_state: Array<{ state: string; count: number; revenue: number }>;
}

export interface OperationsReportData {
  summary: {
    avg_production_hours: number;
    rush_order_pct: number;
    express_order_pct: number;
    artwork_reupload_rate: number;
  };
  production_time_by_product: Array<{ product: string; avg_hours: number }>;
  turnaround_distribution: Array<{ type: string; count: number; pct: number }>;
  artwork_reupload_trend: ChartDataPoint[];
  orders_by_turnaround_over_time: Array<{ date: string; standard: number; express: number; rush: number }>;
}

export interface DateRange {
  from: Date;
  to: Date;
}
