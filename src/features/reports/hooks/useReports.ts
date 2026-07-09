'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { getSalesReport, getOrdersReport, getCustomersReport, getOperationsReport } from '@/lib/api/reports';
import type { DateRange } from '@/types';

export type Period = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | '7d' | '30d' | '3m' | '1y';

const PERIOD_RANGES: Record<Period, () => DateRange> = {
  today: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }),
  yesterday: () => {
    const y = subDays(new Date(), 1);
    return { from: startOfDay(y), to: endOfDay(y) };
  },
  this_week: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }),
  this_month: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  this_year: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  '7d':  () => ({ from: subDays(new Date(), 7),   to: new Date() }),
  '30d': () => ({ from: subDays(new Date(), 30),  to: new Date() }),
  '3m':  () => ({ from: subDays(new Date(), 90),  to: new Date() }),
  '1y':  () => ({ from: subDays(new Date(), 365), to: new Date() }),
};

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  this_month: 'This Month',
  this_year: 'This Year',
  '7d': '7 Days', '30d': '30 Days', '3m': '3 Months', '1y': '1 Year',
};

export function useReportDateRange() {
  const [period, setPeriod] = useState<Period>('30d');
  const [custom, setCustom] = useState<DateRange | undefined>();
  const range = custom ?? PERIOD_RANGES[period]();
  // Send full-precision timestamps, not date-only strings — a date-only
  // "to" is parsed by the backend as midnight, which would silently exclude
  // same-day activity from every report (and collapse Today/Yesterday to a
  // single instant instead of a 24h span).
  const from = startOfDay(range.from).toISOString();
  const to = endOfDay(range.to).toISOString();
  return { period, setPeriod, custom, setCustom, from, to, range };
}

export function useSalesReport(from: string, to: string) {
  return useQuery({ queryKey: ['report-sales', from, to], queryFn: () => getSalesReport(from, to), staleTime: 5 * 60_000 });
}
export function useOrdersReport(from: string, to: string) {
  return useQuery({ queryKey: ['report-orders', from, to], queryFn: () => getOrdersReport(from, to), staleTime: 5 * 60_000 });
}
export function useCustomersReport(from: string, to: string) {
  return useQuery({ queryKey: ['report-customers', from, to], queryFn: () => getCustomersReport(from, to), staleTime: 5 * 60_000 });
}
export function useOperationsReport(from: string, to: string) {
  return useQuery({ queryKey: ['report-operations', from, to], queryFn: () => getOperationsReport(from, to), staleTime: 5 * 60_000 });
}
