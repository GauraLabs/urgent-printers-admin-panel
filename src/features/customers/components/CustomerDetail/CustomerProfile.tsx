import { CustomerStatusBadge } from '@/components/common/StatusBadge';
import { Mail, Phone, Calendar, Globe, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { formatPrice } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';
import type { CustomerWithDetails } from '@/types';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 w-32">{label}</span>
      <span className="text-xs text-[var(--text-primary)] text-right flex-1">{value}</span>
    </div>
  );
}

export function CustomerProfile({ customer }: { customer: CustomerWithDetails }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Identity */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Identity</h3>
        <Row label="Full Name" value={<span className="font-medium">{customer.name}</span>} />
        <Row label="Email" value={
          customer.email ? (
            <span className="flex items-center justify-end gap-1.5">
              {customer.email}
              {customer.email_verified
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                : <XCircle className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
            </span>
          ) : '—'
        } />
        <Row label="Phone" value={customer.phone ?? '—'} />
        <Row label="Status" value={
          <CustomerStatusBadge status={customer.status} />
        } />
        <Row label="Joined" value={formatDate(customer.joined_at)} />
        <Row label="Referral Source" value={customer.referral_source ?? '—'} />
      </div>

      {/* Order summary */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Order Summary</h3>
        <Row label="Total Orders" value={<span className="font-semibold">{customer.total_orders}</span>} />
        <Row label="Total Spent" value={<span className="font-semibold text-[var(--primary)]">{formatPrice(customer.total_spent)}</span>} />
        <Row label="Avg. Order Value" value={formatPrice(customer.avg_order_value)} />
        <Row label="Last Order" value={customer.last_order_at ? formatDate(customer.last_order_at) : 'Never'} />
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="lg:col-span-2 bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--warning)] mb-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Internal Note
          </p>
          <p className="text-xs text-[var(--text-secondary)]">{customer.notes}</p>
        </div>
      )}
    </div>
  );
}
