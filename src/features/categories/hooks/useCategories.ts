'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories, getCategory, createCategory, updateCategory,
  deleteCategory, reorderCategories,
} from '@/lib/api/categories';
import type { Category, CategoryCreateRequest, CategoryUpdateRequest } from '@/lib/api/categories';

export type { Category };

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 60_000,
  });
}

export function useCategoryDetail(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id),
    staleTime: 60_000,
    enabled: !!id && id !== 'new',
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CategoryCreateRequest | CategoryUpdateRequest }) =>
      id ? updateCategory(id, data) : createCategory(data as CategoryCreateRequest),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      // Also bust the individual detail cache so re-opening the edit form
      // gets the updated values rather than stale ones.
      if (variables.id) {
        qc.invalidateQueries({ queryKey: ['category', variables.id] });
      }
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reorderCategories(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
