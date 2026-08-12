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
    // Patch the deleted id out of the cache directly instead of invalidating
    // and refetching. The backend commits the delete transaction in the
    // DB-session dependency's post-response teardown — i.e. AFTER the HTTP
    // response for this DELETE is already sent to the client (see
    // app/core/database.py's get_session: `yield session` then `await
    // session.commit()`, and that generator is solved against FastAPI's
    // outer per-request AsyncExitStack, which only unwinds after the
    // response bytes are on the wire). A `GET /admin/categories` fired the
    // instant this onSuccess runs can therefore land on the backend before
    // that commit and read the row back as still present. Verified live:
    // the row briefly disappeared (via setQueryData below) and then
    // reappeared once that racing refetch's stale response resolved,
    // because a successful refetch always overwrites the cache regardless
    // of what it returns — and once cached as fresh (not invalidated), the
    // stale row had no reason to ever refetch again (no polling, no
    // window-focus refetch, staleTime 60s), so it stuck around
    // indefinitely rather than for a few seconds.
    // A delete doesn't change any *other* category's fields (product_count/
    // sort_order are untouched — only the deleted row's own record and its
    // former products' category_id change), so there's nothing left for a
    // refetch to reconcile here. Skipping it removes the race entirely
    // instead of racing it with a longer delay.
    onSuccess: (_, id) => {
      qc.setQueryData<Category[]>(['categories'], (old) => old?.filter((c) => c.id !== id));
    },
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reorderCategories(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
