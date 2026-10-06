import type { MismatchCause } from '@/lib/api/priceMismatches';

export interface CauseMeta {
  label: string;
  help: string;
  badgeCls: string;
}

export const CAUSE_META: Record<MismatchCause, CauseMeta> = {
  product_updated: {
    label: 'Product updated',
    help: 'The admin changed the price after the item was added.',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40',
  },
  discount_window_boundary: {
    label: 'Sale window',
    help: 'A sale started or ended.',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40',
  },
  price_changed_at_checkout: {
    label: 'Changed at checkout',
    help: 'The order was refused and the customer re-confirmed.',
    badgeCls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/40',
  },
  unexplained: {
    label: 'Unexplained',
    help: 'Possible calculation bug, investigate.',
    badgeCls: 'bg-red-50 text-red-700 border-red-300 font-semibold dark:bg-red-950/40 dark:text-red-300 dark:border-red-700/50',
  },
};

export const STAGE_LABEL = { preview: 'Preview', order_create: 'Order create' } as const;
