import { formatPrice } from '@/lib/utils/formatPrice';

export function formatMoney(n: number | null): string {
  return n === null ? '—' : formatPrice(n);
}

export function formatSignedMoney(n: number | null): string {
  if (n === null) return '—';
  if (n === 0) return formatPrice(0);
  return `${n > 0 ? '+' : '-'}${formatPrice(Math.abs(n))}`;
}

// diff_total = client - server. Negative means the customer saw less than they were charged.
export function diffClass(n: number | null): string {
  if (n === null || n === 0) return 'text-muted-foreground';
  return n > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
}

export function diffLabel(n: number | null): string | null {
  if (n === null || n === 0) return null;
  return `Shown ${formatPrice(Math.abs(n))} ${n < 0 ? 'lower' : 'higher'} than charged`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatIstShort(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const d = new Date(t + 330 * 60_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${d.toISOString().slice(11, 16)} IST`;
}

export function addedAtSourceLabel(src: 'client' | 'server_cart' | null): string {
  if (src === 'client') return 'from browser';
  if (src === 'server_cart') return 'from server cart';
  return 'unknown';
}
