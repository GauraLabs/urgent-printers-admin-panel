'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCoupons, getCoupon, getCouponAnalytics, createCoupon, updateCoupon, deleteCoupon } from '@/lib/api/coupons';
import type { CouponFilters, CreateCouponRequest } from '@/types';

export function useCoupons(filters: CouponFilters = {}) {
  return useQuery({
    queryKey: ['coupons', filters],
    queryFn: () => getCoupons(filters),
    staleTime: 60_000,
  });
}

export function useCouponDetail(id: string) {
  return useQuery({
    queryKey: ['coupon', id],
    queryFn: () => getCoupon(id),
    staleTime: 60_000,
    enabled: !!id && id !== 'new',
  });
}

export function useCouponAnalytics(id: string) {
  return useQuery({
    queryKey: ['coupon-analytics', id],
    queryFn: () => getCouponAnalytics(id),
    staleTime: 60_000,
    enabled: !!id && id !== 'new',
  });
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CreateCouponRequest }) =>
      id ? updateCoupon(id, data) : createCoupon(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}
