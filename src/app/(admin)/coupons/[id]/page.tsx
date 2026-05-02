import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CouponDetailClient } from '@/features/coupons/components/CouponDetailClient';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Coupon' };

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader
        title={id === 'new' ? 'New Coupon' : 'Edit Coupon'}
        actions={
          <Link href={ROUTES.COUPONS} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Coupons
          </Link>
        }
      />
      <CouponDetailClient id={id} />
    </div>
  );
}
