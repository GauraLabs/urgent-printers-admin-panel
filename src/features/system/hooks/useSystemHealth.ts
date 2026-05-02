'use client';

import { useQuery } from '@tanstack/react-query';
import { getSystemHealth, getJobQueue, getErrorLog } from '@/lib/api/system';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useJobQueue() {
  return useQuery({
    queryKey: ['job-queue'],
    queryFn: getJobQueue,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useErrorLog() {
  return useQuery({
    queryKey: ['error-log'],
    queryFn: getErrorLog,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
