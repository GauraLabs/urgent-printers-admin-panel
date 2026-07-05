'use client';

import { useState } from 'react';
import { RefreshCw, XCircle, DollarSign, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UpdateStatusDialog } from '../UpdateStatusDialog';
import { RefundDialog } from '../RefundDialog';
import { useCancelOrder, useUpdateOrderStatus } from '../../hooks/useOrders';
import { ORDER_STATUS_LABELS } from '@/lib/constants/orderStatuses';
import type { OrderWithDetails, OrderStatus } from '@/types';

const QUICK_ACTIONS: Partial<Record<OrderStatus, { label: string; nextStatus: OrderStatus; icon: React.ReactNode; variant?: 'danger' }[]>> = {
  artwork_pending: [{ label: 'Force Approve', nextStatus: 'artwork_approved', icon: <CheckCircle className="h-4 w-4" /> }],
  artwork_approved: [{ label: 'Start Printing', nextStatus: 'printing', icon: <RefreshCw className="h-4 w-4" /> }],
  printing: [{ label: 'Mark Shipped', nextStatus: 'shipped', icon: <Truck className="h-4 w-4" /> }],
  shipped: [{ label: 'Mark Delivered', nextStatus: 'delivered', icon: <CheckCircle className="h-4 w-4" /> }],
};

interface OrderActionsProps {
  order: OrderWithDetails;
}

export function OrderActions({ order }: OrderActionsProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelMutation = useCancelOrder();
  const statusMutation = useUpdateOrderStatus();

  const quickActions = QUICK_ACTIONS[order.status] ?? [];
  const canCancel = !['cancelled', 'refunded', 'delivered'].includes(order.status);
  const canRefund = order.status === 'delivered' || order.status === 'shipped';

  async function applyQuickAction(nextStatus: OrderStatus) {
    try {
      await statusMutation.mutateAsync({ id: order.id, status: nextStatus });
      toast.success(`Order moved to ${ORDER_STATUS_LABELS[nextStatus]}`);
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleCancel() {
    try {
      await cancelMutation.mutateAsync({ id: order.id, reason: 'Cancelled by admin' });
      toast.success(`${order.order_number} cancelled`);
      setCancelOpen(false);
    } catch {
      toast.error('Failed to cancel order');
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl mb-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-muted)]">Current status</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {ORDER_STATUS_LABELS[order.status]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.nextStatus}
              size="sm"
              onClick={() => applyQuickAction(action.nextStatus)}
              disabled={statusMutation.isPending}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}

          <Button variant="outline" size="sm" onClick={() => setUpdateOpen(true)}>
            <RefreshCw className="h-4 w-4" />
            Change Status
          </Button>

          {canRefund && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefundOpen(true)}
              className="border-[var(--warning-border)] text-[var(--warning)] hover:bg-[var(--warning-bg)]"
            >
              <DollarSign className="h-4 w-4" />
              Refund
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="border-[var(--danger-border)] text-[var(--danger)] hover:bg-[var(--danger-bg)]"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <UpdateStatusDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        orderId={order.id}
        orderNumber={order.order_number}
        currentStatus={order.status}
      />

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        orderId={order.id}
        orderNumber={order.order_number}
        maxAmount={order.payment.amount}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel ${order.order_number}?`}
        description="This will cancel the order and notify the customer. This cannot be undone."
        confirmLabel="Yes, cancel order"
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
        variant="danger"
      />
    </>
  );
}
