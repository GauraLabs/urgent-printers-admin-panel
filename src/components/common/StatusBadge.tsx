/**
 * Unified badge system — every status/type badge in the app lives here.
 * All badges use the same visual language: dot + label, subtle bg, colored text.
 * Import the right component; never hand-roll bg/text badge styles inline.
 */

import { cn } from '@/lib/utils/cn';
import type { OrderStatus, ProductStatus, CustomerStatus, PaymentStatus, RefundStatus, CouponStatus, ArtworkStatus, TurnaroundType, ProductBadge } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants/orderStatuses';

// ─── Core variant system ──────────────────────────────────────────────────────

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'yellow' | 'default';

const BG: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950/40',
  warning: 'bg-amber-50 dark:bg-amber-950/40',
  danger:  'bg-red-50 dark:bg-red-950/40',
  info:    'bg-blue-50 dark:bg-blue-950/40',
  purple:  'bg-purple-50 dark:bg-purple-950/40',
  yellow:  'bg-yellow-50 dark:bg-yellow-950/40',
  default: 'bg-slate-100 dark:bg-slate-800/50',
};

const TEXT: Record<BadgeVariant, string> = {
  success: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger:  'text-red-700 dark:text-red-400',
  info:    'text-blue-700 dark:text-blue-400',
  purple:  'text-purple-700 dark:text-purple-400',
  yellow:  'text-yellow-700 dark:text-yellow-500',
  default: 'text-slate-600 dark:text-slate-400',
};

const DOT: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  purple:  'bg-purple-500',
  yellow:  'bg-yellow-400',
  default: 'bg-slate-400',
};

// ─── Base Badge component ─────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ label, variant = 'default', dot = true, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap',
      BG[variant], TEXT[variant], className
    )}>
      {dot && <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', DOT[variant])} />}
      {label}
    </span>
  );
}

// ─── Order status ─────────────────────────────────────────────────────────────

const ORDER_VARIANT: Record<string, BadgeVariant> = {
  success: 'success', warning: 'warning', danger: 'danger', info: 'info', default: 'default',
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const colorKey = ORDER_STATUS_COLORS[status] as string;
  const variant = ORDER_VARIANT[colorKey] ?? 'default';
  return <Badge label={ORDER_STATUS_LABELS[status]} variant={variant} dot className={className} />;
}

// ─── Turnaround type (Standard / Express / Rush) ──────────────────────────────

const TURNAROUND_VARIANT: Record<TurnaroundType, BadgeVariant> = {
  standard: 'default',
  express:  'warning',
  rush:     'danger',
};
const TURNAROUND_LABEL: Record<TurnaroundType, string> = {
  standard: 'Standard',
  express:  'Express',
  rush:     'Rush',
};

export function TurnaroundBadge({ type, className }: { type: TurnaroundType; className?: string }) {
  return <Badge label={TURNAROUND_LABEL[type]} variant={TURNAROUND_VARIANT[type]} dot={false} className={className} />;
}

// ─── Product status (Active / Draft / Archived) ───────────────────────────────

const PRODUCT_STATUS_VARIANT: Record<ProductStatus, BadgeVariant> = {
  active:   'success',
  draft:    'warning',
  archived: 'default',
};

export function ProductStatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={PRODUCT_STATUS_VARIANT[status]} dot className={className} />;
}

// ─── Product badge (Bestseller / New / Sale / Popular) ───────────────────────

const PRODUCT_BADGE_VARIANT: Partial<Record<NonNullable<ProductBadge>, BadgeVariant>> = {
  bestseller: 'yellow',
  new:        'info',
  sale:       'danger',
  popular:    'purple',
};

export function ProductBadgeLabel({ badge, className }: { badge: NonNullable<ProductBadge>; className?: string }) {
  const variant = PRODUCT_BADGE_VARIANT[badge] ?? 'default';
  return <Badge label={badge.charAt(0).toUpperCase() + badge.slice(1)} variant={variant} dot={false} className={className} />;
}

// ─── Customer status ──────────────────────────────────────────────────────────

const CUSTOMER_STATUS_VARIANT: Record<CustomerStatus, BadgeVariant> = {
  active:   'success',
  banned:   'danger',
  inactive: 'default',
};

export function CustomerStatusBadge({ status, className }: { status: CustomerStatus; className?: string }) {
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={CUSTOMER_STATUS_VARIANT[status]} dot className={className} />;
}

// ─── Payment status ───────────────────────────────────────────────────────────

const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  paid:           'success',
  pending:        'warning',
  failed:         'danger',
  refunded:       'default',
  partial_refund: 'warning',
};
const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Paid', pending: 'Pending', failed: 'Failed',
  refunded: 'Refunded', partial_refund: 'Partial Refund',
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <Badge label={PAYMENT_STATUS_LABEL[status]} variant={PAYMENT_STATUS_VARIANT[status]} dot className={className} />;
}

// ─── Refund status ────────────────────────────────────────────────────────────

const REFUND_STATUS_VARIANT: Record<RefundStatus, BadgeVariant> = {
  pending:    'warning',
  processing: 'info',
  completed:  'success',
  failed:     'danger',
};

export function RefundStatusBadge({ status, className }: { status: RefundStatus; className?: string }) {
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={REFUND_STATUS_VARIANT[status]} dot className={className} />;
}

// ─── Coupon status ────────────────────────────────────────────────────────────

const COUPON_STATUS_VARIANT: Record<CouponStatus, BadgeVariant> = {
  active:    'success',
  inactive:  'default',
  expired:   'warning',
  exhausted: 'danger',
};

export function CouponStatusBadge({ status, className }: { status: CouponStatus; className?: string }) {
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={COUPON_STATUS_VARIANT[status]} dot className={className} />;
}

// ─── Artwork status ───────────────────────────────────────────────────────────

const ARTWORK_STATUS_VARIANT: Record<ArtworkStatus, BadgeVariant> = {
  pending:            'warning',
  approved:           'success',
  rejected:           'danger',
  reupload_requested: 'warning',
};
const ARTWORK_STATUS_LABEL: Record<ArtworkStatus, string> = {
  pending:            'Awaiting Upload',
  approved:           'Approved',
  rejected:           'Rejected',
  reupload_requested: 'Reupload Requested',
};

export function ArtworkStatusBadge({ status, className }: { status: ArtworkStatus; className?: string }) {
  return <Badge label={ARTWORK_STATUS_LABEL[status]} variant={ARTWORK_STATUS_VARIANT[status]} dot className={className} />;
}

// ─── Active / Inactive toggle ─────────────────────────────────────────────────

export function ActiveBadge({ active, className }: { active: boolean; className?: string }) {
  return <Badge label={active ? 'Active' : 'Inactive'} variant={active ? 'success' : 'default'} dot className={className} />;
}
