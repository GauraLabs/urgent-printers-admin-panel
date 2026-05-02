'use client';

import { useCategoryDetail } from '../hooks/useCategories';
import { CategoryForm } from './CategoryForm';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export function CategoryEditClient({ id, isNew }: { id: string; isNew: boolean }) {
  const { data: category, isLoading } = useCategoryDetail(id);
  if (!isNew && isLoading) return <LoadingSkeleton rows={4} className="max-w-xl" />;
  return <CategoryForm category={isNew ? undefined : category} />;
}
