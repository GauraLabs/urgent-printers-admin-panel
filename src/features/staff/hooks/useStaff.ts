'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  getStaff, getStaffMember, createStaffMember,
  updateStaffMember, deleteStaffMember, getActivityLog,
} from '@/lib/api/staff';

const STAFF_KEY = ['staff'];

export function useStaff() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [includeInactive, setIncludeInactive] = useState(false);

  const query = useQuery({
    queryKey: [...STAFF_KEY, page, pageSize, includeInactive],
    queryFn: () => getStaff({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      include_inactive: includeInactive,
    }),
    staleTime: 60_000,
  });

  return {
    query,
    page,
    pageSize,
    setPage,
    includeInactive,
    setIncludeInactive,
  };
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
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateStaffMember>[1] }) =>
      updateStaffMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteStaffMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: STAFF_KEY }),
  });
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export function useActivityLog() {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 50,
    actor_admin_id: '',
    resource_type: '',
    action: '',
  });

  const query = useQuery({
    queryKey: ['activity-log', filters],
    queryFn: () => getActivityLog({
      offset: (filters.page - 1) * filters.pageSize,
      limit: filters.pageSize,
      actor_admin_id: filters.actor_admin_id || undefined,
      resource_type: filters.resource_type || undefined,
      action: filters.action || undefined,
    }),
    staleTime: 30_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setActorAdminId: (actor_admin_id: string) => setFilters((f) => ({ ...f, actor_admin_id, page: 1 })),
    setResourceType: (resource_type: string) => setFilters((f) => ({ ...f, resource_type, page: 1 })),
    setAction: (action: string) => setFilters((f) => ({ ...f, action, page: 1 })),
  };
}
