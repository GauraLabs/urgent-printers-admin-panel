'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { subDays, format } from 'date-fns';
import { getSalesReport, getOrdersReport, getCustomersReport, getOperationsReport } from '@/lib/api/reports';
import { formatApiDate } from '@/lib/utils/formatDate';
import type { DateRange } from '@/types';

export type Period = '7d' | '30d' | '3m' | '1y';

const PERIOD_RANGES: Record<Period, () => DateRange> = {
  '7d':  () => ({ from: subDays(new Date(), 7),   to: new Date() }),
  '30d': () => ({ from: subDays(new Date(), 30),  to: new Date() }),
  '3m':  () => ({ from: subDays(new Date(), 90),  to: new Date() }),
  '1y':  () => ({ from: subDays(new Date(), 365), to: new Date() }),
};

export const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 Days', '30d': '30 Days', '3m': '3 Months', '1y': '1 Year',
};

export function useReportDateRange() {
  const [period, setPeriod] = useState<Period>('30d');
  const [custom, setCustom] = useState<DateRange | undefined>();
  const range = custom ?? PERIOD_RANGES[period]();
  const from = formatApiDate(range.from);
  const to = formatApiDate(range.to);
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
