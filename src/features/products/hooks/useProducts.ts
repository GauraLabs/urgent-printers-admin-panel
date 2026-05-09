'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, type ProductPayload } from '@/lib/api/products';
import type { ProductFilters, ProductStatus } from '@/types';

const PRODUCTS_KEY = ['products'];

export function useProducts() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, page_size: 20 });

  const query = useQuery({
    queryKey: [...PRODUCTS_KEY, filters],
    queryFn: () => getProducts(filters),
    staleTime: 60_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setSearch: () => { /* backend search not yet implemented */ },
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
