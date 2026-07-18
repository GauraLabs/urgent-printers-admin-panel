'use client';

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle, MessageSquare, Star, Info } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ReplyDialog } from './ReplyDialog';
import { useReviews, useUpdateReviewStatus } from '../hooks/useReviews';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils/formatDate';
import { ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';
import type { Review } from '@/types';

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning', approved: 'success', rejected: 'danger',
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
      ))}
    </div>
  );
}

export function ReviewsTable() {
  const { query, filters, setPage, setStatus } = useReviews();
  const statusMutation = useUpdateReviewStatus();
  const { canModerateReviews } = usePermissions();
  const [replyReview, setReplyReview] = useState<Review | null>(null);

  async function moderate(id: string, status: 'approved' | 'rejected', label: string) {
    try {
      await statusMutation.mutateAsync({ id, status });
      toast.success(`Review ${label}`);
    } catch { toast.error('Action failed'); }
  }

  const columns: ColumnDef<Review, unknown>[] = [
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-[13px] font-semibold text-foreground">{row.original.customer_name}</p>
          <Link href={ROUTES.ORDER_DETAIL(row.original.order_id)} className="text-[11px] text-primary hover:underline font-mono">
            {row.original.order_number}
          </Link>
        </div>
      ),
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <p className="text-[13px] text-foreground truncate max-w-[160px]">{row.original.product_name}</p>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      cell: ({ row }) => <StarRow rating={row.original.rating} />,
    },
    {
      id: 'review',
      header: 'Review',
      cell: ({ row }) => (
        <p className="text-[13px] text-muted-foreground line-clamp-2 max-w-xs">{row.original.body}</p>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          label={row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
          variant={STATUS_VARIANT[row.original.status] ?? 'default'}
          dot
        />
      ),
    },
    {
      id: 'replied',
      header: 'Replied',
      cell: ({ row }) => (
        <span className={`text-[13px] font-medium ${row.original.admin_reply ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
          {row.original.admin_reply ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => <span className="text-[13px] text-muted-foreground">{formatDate(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      header: '',
      size: 130,
      cell: ({ row }) => {
        const r = row.original;
        if (!canModerateReviews) return null;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground" onClick={() => setReplyReview(r)}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            {r.status !== 'approved' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => moderate(r.id, 'approved', 'approved')} disabled={statusMutation.isPending}>
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            {r.status !== 'rejected' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-destructive/10" onClick={() => moderate(r.id, 'rejected', 'rejected')} disabled={statusMutation.isPending}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {!canModerateReviews && (
        <div className="flex items-start gap-2 px-3 py-2 mb-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[12px] text-[var(--text-muted)]">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>You have view-only access to Reviews. The &ldquo;Moderate Reviews&rdquo; permission is required to approve, reject, or reply to reviews.</p>
        </div>
      )}
      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        isLoading={query.isLoading}
        page={filters.page}
        pageSize={filters.page_size}
        total={query.data?.total}
        onPageChange={setPage}
        compact
        getRowId={(r) => r.id}
        emptyMessage="No reviews found."
        toolbar={
          <Select value={filters.status} onValueChange={(v) => setStatus(v ?? '')}>
            <SelectTrigger size="sm" className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {replyReview && canModerateReviews && (
        <ReplyDialog open={!!replyReview} onOpenChange={(v) => !v && setReplyReview(null)} review={replyReview} />
      )}
    </>
  );
}
