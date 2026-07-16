import type { Metadata } from 'next';
import { DispatchOrderClient } from '@/features/printing-queue/components/DispatchOrderClient';

export const metadata: Metadata = { title: 'Dispatch Order' };

export default async function DispatchOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <DispatchOrderClient orderId={orderId} />;
}
