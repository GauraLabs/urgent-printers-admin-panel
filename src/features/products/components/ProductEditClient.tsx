'use client';

import { useProductDetail } from '../hooks/useProducts';
import { ProductForm } from './ProductForm';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';

export function ProductEditClient({ id }: { id: string }) {
  const { data: product, isLoading } = useProductDetail(id);
  if (isLoading) return <PageSkeleton />;
  return <ProductForm product={product} />;
}
