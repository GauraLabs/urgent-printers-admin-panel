'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Send, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProofStatusBadge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ProofUploadDialog } from '../ProofUploadDialog';
import { useOrderProofs, useSendProof } from '../../hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import type { OrderWithDetails, OrderItemProof } from '@/types';

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

interface OrderProofsProps {
  order: OrderWithDetails;
}

export function OrderProofs({ order }: OrderProofsProps) {
  const { data: proofs, isLoading } = useOrderProofs(order.id);
  const sendMutation = useSendProof();
  const [dialogState, setDialogState] = useState<{ open: boolean; itemId: string; itemName: string; canUpload: boolean }>({
    open: false,
    itemId: '',
    itemName: '',
    canUpload: true,
  });

  const user = useAuthStore.getState().user;
  const hasPermission = user?.permissions.includes('orders.manage_proofs') ?? false;

  function getProofForItem(itemId: string): OrderItemProof | undefined {
    return proofs?.find((p) => p.order_item_id === itemId);
  }

  function canUploadForItem(proof: OrderItemProof | undefined): boolean {
    if (!proof) return true;
    return proof.status === 'rejected';
  }

  function openUploadDialog(itemId: string, itemName: string, proof: OrderItemProof | undefined) {
    setDialogState({ open: true, itemId, itemName, canUpload: canUploadForItem(proof) });
  }

  async function handleSend(itemId: string) {
    try {
      await sendMutation.mutateAsync({ orderId: order.id, itemId });
      toast.success('Proof sent to customer for approval');
    } catch {
      toast.error('Failed to send proof. Please try again.');
    }
  }

  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Artwork Proofs</h3>
          {!hasPermission && (
            <span className="text-[11px] text-[var(--text-muted)]">Requires &apos;Manage Artwork Proofs&apos; permission</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={order.items.length || 2} />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {order.items.map((item) => {
              const proof = getProofForItem(item.id);
              const proofUrl = proof ? `${R2_PUBLIC_URL}/${proof.file_key}` : null;
              const canUpload = canUploadForItem(proof);

              return (
                <li key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.product_name}</p>
                      {proof ? (
                        <div className="flex items-center gap-2 mt-1">
                          <ProofStatusBadge status={proof.status} />
                          <span className="text-[11px] text-[var(--text-muted)]">v{proof.version}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">No proof uploaded</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {proofUrl && (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      )}
                    </div>
                  </div>

                  {proof && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{proof.original_filename}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!hasPermission}
                      title={!hasPermission ? "Requires 'Manage Artwork Proofs' permission" : undefined}
                      onClick={() => openUploadDialog(item.id, item.product_name, proof)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Proof
                    </Button>

                    {proof?.status === 'pending_review' && (
                      <Button
                        size="sm"
                        disabled={!hasPermission || sendMutation.isPending}
                        title={!hasPermission ? "Requires 'Manage Artwork Proofs' permission" : undefined}
                        onClick={() => handleSend(item.id)}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sendMutation.isPending ? 'Sending…' : 'Send to Customer'}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}

            {order.items.length === 0 && (
              <li className="p-6 text-center text-sm text-[var(--text-muted)]">No proofs uploaded yet.</li>
            )}
          </ul>
        )}
      </div>

      <ProofUploadDialog
        open={dialogState.open}
        onOpenChange={(v) => setDialogState((s) => ({ ...s, open: v }))}
        orderId={order.id}
        itemId={dialogState.itemId}
        itemName={dialogState.itemName}
        canUpload={dialogState.canUpload}
      />
    </>
  );
}
