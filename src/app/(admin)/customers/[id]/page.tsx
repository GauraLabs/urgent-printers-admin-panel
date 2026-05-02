import type { Metadata } from 'next';
import { CustomerDetailClient } from '@/features/customers/components/CustomerDetail/CustomerDetailClient';

export const metadata: Metadata = { title: 'Customer Profile' };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerDetailClient id={id} />;
}
