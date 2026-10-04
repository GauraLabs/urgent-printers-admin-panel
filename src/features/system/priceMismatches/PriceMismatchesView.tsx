'use client';

import { PermissionGate } from '@/components/common/PermissionGate';
import { PriceMismatchSummary } from './PriceMismatchSummary';
import { PriceMismatchTable } from './PriceMismatchTable';

export function PriceMismatchesView() {
  return (
    <PermissionGate
      permission="system.view"
      fallback={<p className="text-[13px] text-muted-foreground">You do not have permission to view price mismatches.</p>}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-1">Last 7 days</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Where the storefront showed a price that differed from the server calculation.</p>
          <PriceMismatchSummary />
        </section>
        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-3">Mismatches</h2>
          <PriceMismatchTable />
        </section>
      </div>
    </PermissionGate>
  );
}
