import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReviewsTable } from '@/features/reviews/components/ReviewsTable';

export const metadata: Metadata = { title: 'Reviews' };

export default function ReviewsPage() {
  return (
    <div>
      <PageHeader title="Reviews" description="Moderate customer reviews and post official replies." />
      <ReviewsTable />
    </div>
  );
}
