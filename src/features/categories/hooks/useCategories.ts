'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/api/categories';
import type { Category } from '@/lib/api/categories';

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
    mutationFn: ({ id, data }: { id?: string; data: Partial<Category> }) =>
      id ? updateCategory(id, data) : createCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
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
