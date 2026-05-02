'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '@/lib/api/products';
import type { ProductFilters, Product } from '@/types';

export function useProducts() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, page_size: 20 });

  const query = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 60_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setSearch: (search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })),
    setStatus: (status: ProductFilters['status']) => setFilters((f) => ({ ...f, status, page: 1 })),
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
    mutationFn: ({ id, data }: { id?: string; data: Partial<Product> }) =>
      id ? updateProduct(id, data) : createProduct(data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      if (id) qc.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
