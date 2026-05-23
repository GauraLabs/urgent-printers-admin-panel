'use client';

import { useState } from 'react';
import { ShieldOff, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useUpdateCustomerStatus } from '../../hooks/useCustomers';
import { formatPrice } from '@/lib/utils/formatPrice';
import { formatDate } from '@/lib/utils/formatDate';
import type { CustomerWithDetails } from '@/types';

export function CustomerActions({ customer }: { customer: CustomerWithDetails }) {
  const mutation = useUpdateCustomerStatus();
  const [confirmBan, setConfirmBan] = useState(false);
  const [confirmUnban, setConfirmUnban] = useState(false);

  const isBanned = customer.status === 'banned';

  async function handleBan() {
    try {
      await mutation.mutateAsync({ id: customer.id, status: 'banned' });
      toast.success(`${customer.name} has been banned`);
      setConfirmBan(false);
    } catch { toast.error('Failed to ban customer'); }
  }

  async function handleUnban() {
    try {
      await mutation.mutateAsync({ id: customer.id, status: 'active' });
      toast.success(`${customer.name} has been reinstated`);
      setConfirmUnban(false);
    } catch { toast.error('Failed to reinstate customer'); }
  }

  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-[var(--surface-secondary)] rounded-lg">
            <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{customer.total_orders}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Orders</p>
          </div>
          <div className="text-center p-3 bg-[var(--surface-secondary)] rounded-lg">
            <p className="text-sm font-bold text-[var(--primary)] tabular-nums">{formatPrice(customer.total_spent)}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Lifetime Value</p>
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)] space-y-1">
          <p>Joined {formatDate(customer.joined_at)}</p>
          {customer.last_order_at && <p>Last order {formatDate(customer.last_order_at)}</p>}
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" /> Send Email
            </a>
          )}

          {isBanned ? (
            <button
              onClick={() => setConfirmUnban(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs border border-[var(--success-border)] rounded-lg text-green-700 hover:bg-[var(--success-bg)] transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Reinstate Customer
            </button>
          ) : (
            <button
              onClick={() => setConfirmBan(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs border border-[var(--danger-border)] rounded-lg text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
            >
              <ShieldOff className="h-3.5 w-3.5" /> Ban Customer
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmBan}
        onOpenChange={setConfirmBan}
        title={`Ban ${customer.name}?`}
        description="This prevents them from logging in or placing orders. They will be notified by email."
        confirmLabel="Ban Customer"
        onConfirm={handleBan}
        isLoading={mutation.isPending}
        variant="danger"
      />
      <ConfirmDialog
        open={confirmUnban}
        onOpenChange={setConfirmUnban}
        title={`Reinstate ${customer.name}?`}
        description="This will restore full account access for this customer."
        confirmLabel="Reinstate"
        onConfirm={handleUnban}
        isLoading={mutation.isPending}
        variant="default"
      />
    </>
  );
}
