import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { TestimonialsManager } from '@/features/content/components/TestimonialsManager';

export const metadata: Metadata = { title: 'Testimonials' };

export default function TestimonialsPage() {
  return (
    <div>
      <PageHeader title="Testimonials" description="Manage customer testimonials shown on the homepage." />
      <TestimonialsManager />
    </div>
  );
}
