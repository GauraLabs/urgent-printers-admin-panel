'use client';

import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { usePermissions } from '@/hooks/usePermissions';
import { useOrderHaltStatus, useOrderHaltMutation } from '../hooks/useOrderHalt';

const DEFAULT_CUSTOMER_MESSAGE = "We're temporarily not accepting new orders. Please check back shortly.";

const textareaCls = 'mt-1 w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40';

export function EmergencyOrderHalt() {
  const { canViewSettings, canManageSettings } = usePermissions();
  const { data: halt, isLoading } = useOrderHaltStatus();
  const mutation = useOrderHaltMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [customerMessage, setCustomerMessage] = useState('');
  const [internalReason, setInternalReason] = useState('');

  if (!canViewSettings) return null;
  if (isLoading) return <LoadingSkeleton rows={2} className="max-w-2xl" />;

  const isHalted = halt?.is_halted ?? false;

  async function applyHalt(next: boolean, message?: string | null, reason?: string | null) {
    try {
      await mutation.mutateAsync({
        is_halted: next,
        customer_message: message !== undefined ? message : (halt?.customer_message ?? null),
        internal_reason: reason !== undefined ? reason : (halt?.internal_reason ?? null),
      });
      toast.success(next ? 'Orders halted — checkout is now blocked site-wide' : 'Order halt lifted — checkout re-enabled');
    } catch {
      toast.error('Failed to update order halt. Please try again.');
    }
  }

  function handleToggle(checked: boolean) {
    if (!canManageSettings || mutation.isPending) return;
    if (checked) {
      setCustomerMessage(halt?.customer_message ?? DEFAULT_CUSTOMER_MESSAGE);
      setInternalReason('');
      setConfirmOpen(true);
    } else {
      setDisableConfirmOpen(true);
    }
  }

  async function confirmEnable() {
    await applyHalt(true, customerMessage.trim() || null, internalReason.trim() || null);
    setConfirmOpen(false);
  }

  async function confirmDisable() {
    await applyHalt(false);
    setDisableConfirmOpen(false);
  }

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 ${
        isHalted
          ? 'border-[var(--danger)]/50 bg-[var(--danger)]/5'
          : 'border-amber-500/40 bg-amber-500/5 dark:border-amber-500/30'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isHalted ? 'text-[var(--danger)]' : 'text-amber-600 dark:text-amber-400'}`} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-foreground">
              Emergency: Halt New Orders
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5 max-w-md">
              {isHalted
                ? 'New orders are currently BLOCKED site-wide. Existing orders are unaffected.'
                : 'Immediately stop checkout across the entire storefront during an incident — no deploy required.'}
            </p>
          </div>
        </div>
        <Switch
          checked={isHalted}
          onCheckedChange={handleToggle}
          disabled={!canManageSettings || mutation.isPending}
        />
      </div>

      {!canManageSettings && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Settings. The &ldquo;Manage Settings&rdquo; permission is required to toggle order halt.</p>
        </div>
      )}

      {isHalted && halt?.customer_message && (
        <p className="text-[12px] text-muted-foreground">
          Customer-facing message: <span className="text-foreground">&ldquo;{halt.customer_message}&rdquo;</span>
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Halt all new orders?</DialogTitle>
            <DialogDescription>
              This immediately blocks new checkouts for every customer on the storefront. Orders already placed continue processing normally and are not cancelled. You can lift the halt at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-medium text-foreground">Message shown to customers (optional)</label>
              <textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                rows={2}
                className={textareaCls}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">Internal reason (staff-only, optional)</label>
              <textarea
                value={internalReason}
                onChange={(e) => setInternalReason(e.target.value)}
                rows={2}
                placeholder="e.g. payment gateway outage, printing capacity incident..."
                className={textareaCls}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmEnable()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Halting…' : 'Halt Orders'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disableConfirmOpen} onOpenChange={setDisableConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume accepting orders?</DialogTitle>
            <DialogDescription>
              Customers will be able to check out again immediately across the entire storefront.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDisableConfirmOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void confirmDisable()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Resuming…' : 'Resume Orders'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
