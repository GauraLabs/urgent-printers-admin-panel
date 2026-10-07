import { formatPrice } from '@/lib/utils/formatPrice';
import { displayDiscountPercent } from '@/lib/utils/discount';

interface Props {
  mrp: number | null | undefined;
  price: number | null | undefined;
}

export function DiscountPreview({ mrp, price }: Props) {
  if (price == null || !(price > 0)) return <span className="text-[var(--text-muted)]">—</span>;
  const percent = displayDiscountPercent(mrp, price);
  if (percent == null || mrp == null) {
    return <span className="text-[var(--text-muted)]">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums whitespace-nowrap" data-testid="discount-preview">
      <s className="text-[var(--text-muted)]">{formatPrice(mrp)}</s>
      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        {percent}% off
      </span>
      <span className="font-semibold text-[var(--text-primary)]">{formatPrice(price)}</span>
    </span>
  );
}
