import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { ShipmentsTable } from '@/features/shipping/components/ShipmentsTable';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Shipping' };

export default function ShippingPage() {
  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Track all dispatched orders."
        actions={
          <Link href={ROUTES.SHIPPING_SERVICEABILITY} className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            Check Serviceability →
          </Link>
        }
      />
      <ShipmentsTable />
    </div>
  );
}
