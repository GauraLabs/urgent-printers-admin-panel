'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CouponForm } from './CouponForm';
import { CouponAnalytics } from './CouponAnalytics';
import { useCouponDetail } from '../hooks/useCoupons';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export function CouponDetailClient({ id }: { id: string }) {
  const isNew = id === 'new';
  const { data: coupon, isLoading } = useCouponDetail(id);

  if (!isNew && isLoading) return <LoadingSkeleton rows={6} className="max-w-2xl" />;

  if (isNew) {
    return <CouponForm />;
  }

  return (
    <Tabs defaultValue="edit">
      <TabsList className="mb-5">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <CouponForm coupon={coupon} />
      </TabsContent>
      <TabsContent value="analytics">
        {coupon && <CouponAnalytics couponId={coupon.id} />}
      </TabsContent>
    </Tabs>
  );
}
