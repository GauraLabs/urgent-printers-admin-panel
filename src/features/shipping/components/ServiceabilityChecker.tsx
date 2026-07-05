'use client';

import { useState } from 'react';
import { Search, CheckCircle2, XCircle, Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceability } from '../hooks/useShipping';
import { formatPrice } from '@/lib/utils/formatPrice';

export function ServiceabilityChecker() {
  const [pincode, setPincode] = useState('');
  const [query, setQuery] = useState('');
  const { data, isLoading } = useServiceability(query);

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <p className="text-[13px] font-medium text-foreground mb-1.5">Enter Pincode</p>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit pincode"
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Button onClick={() => setQuery(pincode)} disabled={pincode.length !== 6 || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Check
          </Button>
        </div>
      </div>

      {data && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            {data.is_serviceable
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              : <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
            <span className="font-semibold text-[14px] text-foreground">
              {data.pincode} — {data.is_serviceable ? 'Serviceable' : 'Not Serviceable'}
            </span>
          </div>

          {data.is_serviceable && data.couriers.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Available Couriers</p>
              {data.couriers.map((c) => (
                <div key={c.courier_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[13px] font-medium text-foreground">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                    <span>{c.min_days}–{c.max_days} days</span>
                    <span className="font-semibold text-foreground">{formatPrice(c.rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
