'use client';

import Link from 'next/link';
import { ArrowLeft, PackageX } from 'lucide-react';
import { useProductDetail } from '../hooks/useProducts';
import { ProductForm } from './ProductForm';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { ROUTES } from '@/lib/constants/routes';
import type { ApiError } from '@/types';

export function ProductEditClient({ id }: { id: string }) {
  const { data: product, isLoading, error } = useProductDetail(id);

  if (isLoading) return <PageSkeleton />;

  const apiError = error as ApiError | null;
  const isNotFound = apiError?.status === 404;

  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageX className="h-12 w-12 text-[var(--text-muted)] mb-4" />
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Product not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          No product with ID <span className="font-mono">{id}</span> exists.
        </p>
        <Link
          href={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-[var(--danger)] mb-4">
          {apiError?.message ?? 'Failed to load product. Please try again.'}
        </p>
        <Link
          href={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
