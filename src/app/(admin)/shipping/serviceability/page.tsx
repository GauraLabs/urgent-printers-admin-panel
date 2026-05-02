import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceabilityChecker } from '@/features/shipping/components/ServiceabilityChecker';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Serviceability Check' };

export default function ServiceabilityPage() {
  return (
    <div>
      <PageHeader
        title="Serviceability Checker"
        description="Check if a pincode is serviceable and view available couriers."
        actions={
          <Link href={ROUTES.SHIPPING} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Shipments
          </Link>
        }
      />
      <ServiceabilityChecker />
    </div>
  );
}
