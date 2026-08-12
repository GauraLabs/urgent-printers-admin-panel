'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, type ProductPayload } from '@/lib/api/products';
import type { ApiError, ProductFilters, ProductStatus } from '@/types';

const PRODUCTS_KEY = ['products'];

// Column id → backend sort field. Only columns with enableSorting: true in
// ProductsTable.tsx need an entry here.
const SORT_FIELD_MAP: Record<string, string> = {
  name: 'name',
  min_price: 'min_price',
  created_at: 'created',
};

function toSortParam(sorting: SortingState): string | undefined {
  const [s] = sorting;
  if (!s) return undefined;
  const field = SORT_FIELD_MAP[s.id];
  if (!field) return undefined;
  return `${field}_${s.desc ? 'desc' : 'asc'}`;
}

export function useProducts() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, page_size: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const query = useQuery({
    queryKey: [...PRODUCTS_KEY, filters, sorting],
    queryFn: () => getProducts({ ...filters, sort: toSortParam(sorting) }),
    staleTime: 60_000,
  });

  return {
    query,
    filters,
    sorting,
    setSorting,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setSearch: (q: string) => setFilters((f) => ({ ...f, q: q || undefined, page: 1 })),
    setStatus: (status: ProductStatus | undefined) => setFilters((f) => ({ ...f, status, page: 1 })),
    setCategory: (category_id: string | undefined) => setFilters((f) => ({ ...f, category_id, page: 1 })),
  };
}

export function useProductDetail(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    staleTime: 60_000,
    enabled: !!id && id !== 'new',
    // A 404 is permanent — retrying it just delays showing the not-found
    // state. Other failures (network, 5xx) still get the app's normal retry.
    retry: (failureCount, error) => (error as unknown as ApiError).status !== 404 && failureCount < 1,
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ProductPayload }) =>
      id ? updateProduct(id, data) : createProduct(data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
      if (id) qc.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
