import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoriesTable } from '@/features/categories/components/CategoriesTable';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage product categories and their display order."
        actions={
          <Link href={`${ROUTES.CATEGORIES}/new`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
            <Plus className="h-4 w-4" /> Add Category
          </Link>
        }
      />
      <CategoriesTable />
    </div>
  );
}
