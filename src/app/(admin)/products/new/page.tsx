import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductForm } from '@/features/products/components/ProductForm';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'New Product' };

export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="New Product"
        actions={
          <Link href={ROUTES.PRODUCTS} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Products
          </Link>
        }
      />
      <ProductForm />
    </div>
  );
}
