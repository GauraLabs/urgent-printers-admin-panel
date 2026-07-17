'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getShipments, checkServiceability, createManualShipment, createShipment, updateShipmentStatus,
} from '@/lib/api/shipping';
import type { ManualShipmentPayload, CreateShipmentOverrides, ManualShipmentStatusTarget } from '@/lib/api/shipping';

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

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      courier,
      overrides,
    }: {
      orderId: string;
      courier: string;
      overrides?: CreateShipmentOverrides;
    }) => createShipment(orderId, courier, overrides),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['printing-queue'] });
    },
  });
}

export function useCreateManualShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: ManualShipmentPayload }) =>
      createManualShipment(orderId, payload),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['printing-queue'] });
    },
  });
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: ManualShipmentStatusTarget }) =>
      updateShipmentStatus(orderId, status),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['printing-queue'] });
    },
  });
}
