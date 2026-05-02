import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategoryEditClient } from '@/features/categories/components/CategoryEditClient';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Edit Category' };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';
  return (
    <div>
      <PageHeader
        title={isNew ? 'New Category' : 'Edit Category'}
        actions={
          <Link href={ROUTES.CATEGORIES} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Categories
          </Link>
        }
      />
      <CategoryEditClient id={id} isNew={isNew} />
    </div>
  );
}
