import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductsTable } from '@/features/products/components/ProductsTable';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalogue."
        actions={
          <Link href={ROUTES.PRODUCT_NEW} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        }
      />
      <ProductsTable />
    </div>
  );
}
