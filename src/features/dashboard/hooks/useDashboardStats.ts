'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  getRevenueChart,
  getRecentOrders,
  getTopProducts,
  getOrderStatusBreakdown,
} from '@/lib/api/dashboard';

export type RevenuePeriod = '7d' | '30d' | '3m' | '1y';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useRevenueChart(period: RevenuePeriod) {
  return useQuery({
    queryKey: ['revenue-chart', period],
    queryFn: () => getRevenueChart(period),
    staleTime: 60_000,
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['recent-orders-feed'],
    queryFn: getRecentOrders,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: getTopProducts,
    staleTime: 60_000,
  });
}

export function useOrderStatusBreakdown() {
  return useQuery({
    queryKey: ['order-status-breakdown'],
    queryFn: getOrderStatusBreakdown,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}
