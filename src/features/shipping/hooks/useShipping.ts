'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getShipments, checkServiceability } from '@/lib/api/shipping';

export function useShipments() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['shipments', page],
    queryFn: () => getShipments({ page }),
    staleTime: 30_000,
  });
  return { query, page, setPage };
}

export function useServiceability(pincode: string) {
  return useQuery({
    queryKey: ['serviceability', pincode],
    queryFn: () => checkServiceability(pincode),
    enabled: pincode.length === 6,
    staleTime: 5 * 60_000,
  });
}
