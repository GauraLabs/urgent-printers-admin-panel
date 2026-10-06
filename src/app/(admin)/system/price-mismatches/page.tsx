import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PriceMismatchesView } from '@/features/system/priceMismatches/PriceMismatchesView';
import { ROUTES } from '@/lib/constants/routes';

export const metadata: Metadata = { title: 'Price Mismatches' };

export default function PriceMismatchesPage() {
  return (
    <div>
      <PageHeader
        title="Price Mismatches"
        description="Diagnostics for cases where the storefront price differed from the server-computed price."
        actions={
          <Link href={ROUTES.SYSTEM} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> System Health
          </Link>
        }
      />
      <PriceMismatchesView />
    </div>
  );
}
