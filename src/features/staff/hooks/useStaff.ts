'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getStaff, getStaffMember, createStaffMember,
  updateStaffMember, deleteStaffMember, getActivityLog,
} from '@/lib/api/staff';

export function useStaff() {
  return useQuery({ queryKey: ['staff'], queryFn: getStaff, staleTime: 60_000 });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: ['staff-member', id],
    queryFn: () => getStaffMember(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStaffMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateStaffMember>[1] }) =>
      updateStaffMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStaffMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

export function useActivityLog() {
  const [filters, setFilters] = useState({ page: 1, admin_id: '', entity_type: '' });

  const query = useQuery({
    queryKey: ['activity-log', filters],
    queryFn: () => getActivityLog({
      page: filters.page,
      admin_id: filters.admin_id || undefined,
      entity_type: filters.entity_type || undefined,
    }),
    staleTime: 30_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setAdminId: (admin_id: string) => setFilters((f) => ({ ...f, admin_id, page: 1 })),
    setEntityType: (entity_type: string) => setFilters((f) => ({ ...f, entity_type, page: 1 })),
  };
}
