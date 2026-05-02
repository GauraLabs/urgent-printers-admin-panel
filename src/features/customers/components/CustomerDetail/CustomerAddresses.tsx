import { MapPin, Star } from 'lucide-react';
import type { CustomerAddress } from '@/types';

export function CustomerAddresses({ addresses }: { addresses: CustomerAddress[] }) {
  if (!addresses.length) {
    return <p className="text-sm text-[var(--text-muted)] py-6 text-center">No saved addresses.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {addresses.map((addr) => (
        <div key={addr.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
              <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              {addr.name}
            </div>
            {addr.is_default && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">
                <Star className="h-2.5 w-2.5 fill-yellow-500" /> Default
              </span>
            )}
          </div>
          <address className="not-italic text-xs text-[var(--text-secondary)] leading-relaxed">
            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
            {addr.city}, {addr.state} — {addr.pincode}<br />
            <a href={`tel:${addr.phone}`} className="text-[var(--primary)] hover:underline">{addr.phone}</a>
          </address>
        </div>
      ))}
    </div>
  );
}
