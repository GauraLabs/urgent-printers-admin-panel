import { toPaise, discountPercent } from './discount';
import { formatPrice } from './formatPrice';

export const MAX_LINE_QUANTITY = 1_000_000;

export interface QtyTier {
  quantity: number;
  price_per_unit: number;
  mrp_per_unit?: number | null;
}

export interface OrderLimits {
  listing: number | null;
  min: number | null;
  max: number | null;
}

export interface EffectiveLimits {
  min: number;
  max: number;
  hasMax: boolean;
  listing: number;
}

const validQty = (q: number): boolean => Number.isFinite(q) && q >= 1;

export function lowestTierQuantity(tiers: ReadonlyArray<{ quantity: number }>): number {
  const qs = tiers.map((t) => t.quantity).filter(validQty);
  return qs.length ? Math.min(...qs) : 1;
}

export function effectiveLimits(limits: OrderLimits, tiers: ReadonlyArray<{ quantity: number }>): EffectiveLimits {
  const min = limits.min ?? lowestTierQuantity(tiers);
  const max = limits.max ?? MAX_LINE_QUANTITY;
  const raw = limits.listing ?? min;
  const listing = Math.min(Math.max(raw, min), Math.max(max, min));
  return { min, max, hasMax: limits.max != null, listing };
}

/** Highest tier at or below `qty`; the lowest tier when `qty` is below all of them. */
export function tierForQuantity<T extends { quantity: number }>(tiers: readonly T[], qty: number): T | null {
  const valid = tiers.filter((t) => validQty(t.quantity));
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a.quantity - b.quantity);
  let found = sorted[0];
  for (const t of sorted) if (t.quantity <= qty) found = t;
  return found;
}

function decimalParts(n: number): { int: bigint; scale: number } {
  const str = /e/i.test(String(n)) ? n.toFixed(12).replace(/0+$/, '') : String(n);
  const [whole, frac = ''] = str.replace(/\.$/, '').split('.');
  return { int: BigInt(whole + frac), scale: frac.length };
}

/** Price x every multiplier, exact decimal product, HALF_UP to the paisa once (mirrors the server's Decimal math). */
export function unitPaiseWithMultipliers(rupees: number, multipliers: readonly number[]): number {
  let num = decimalParts(rupees);
  let int = num.int;
  let scale = num.scale;
  for (const m of multipliers) {
    num = decimalParts(m);
    int *= num.int;
    scale += num.scale;
  }
  const den = BigInt(10) ** BigInt(scale);
  return Number((BigInt(2) * int * BigInt(100) + den) / (BigInt(2) * den));
}

type MultiplierItem = { price_multiplier: number; is_active?: boolean };

/** Cheapest active multiplier of each option group that has one (groups with none are x1). */
export function minOptionMultipliers(groups: ReadonlyArray<ReadonlyArray<MultiplierItem> | undefined>): number[] {
  const out: number[] = [];
  for (const g of groups) {
    const active = (g ?? []).filter((o) => o.is_active !== false && Number.isFinite(o.price_multiplier) && o.price_multiplier > 0);
    if (active.length > 0) out.push(Math.min(...active.map((o) => o.price_multiplier)));
  }
  return out;
}

export interface ListingPreview {
  qty: number;
  unitPaise: number;
  totalPaise: number;
  mrpTotalPaise: number | null;
  percentOff: number | null;
}

export function listingPreview(
  tiers: readonly QtyTier[],
  qty: number,
  multipliers: readonly number[],
): ListingPreview | null {
  const tier = tierForQuantity(tiers, qty);
  if (!tier || !Number.isFinite(tier.price_per_unit) || !(tier.price_per_unit > 0)) return null;
  const unitPaise = unitPaiseWithMultipliers(tier.price_per_unit, multipliers);
  if (!(unitPaise > 0)) return null;
  let mrpTotalPaise: number | null = null;
  let percentOff: number | null = null;
  if (tier.mrp_per_unit != null && Number.isFinite(tier.mrp_per_unit)) {
    const mrpUnit = unitPaiseWithMultipliers(tier.mrp_per_unit, multipliers);
    if (mrpUnit > unitPaise) {
      mrpTotalPaise = mrpUnit * qty;
      const pct = discountPercent(mrpUnit / 100, unitPaise / 100);
      percentOff = pct >= 1 ? pct : null;
    }
  }
  return { qty, unitPaise, totalPaise: unitPaise * qty, mrpTotalPaise, percentOff };
}

const fmtInt = (n: number): string => new Intl.NumberFormat('en-IN').format(n);

export function formatQty(qty: number, unitLabel: string): string {
  const n = fmtInt(qty);
  if (qty === 1 && unitLabel === 'pcs') return '1 pc';
  return `${n} ${unitLabel}`;
}

export function perPieceSuffix(unitLabel: string): string {
  return unitLabel === 'pcs' ? '/pc' : ' each';
}

const money = (paise: number): string => formatPrice(paise / 100);
const money2 = (paise: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paise / 100);

export function cardPreviewText(p: ListingPreview, unitLabel: string): string {
  return `${formatQty(p.qty, unitLabel)} for ${money2(p.totalPaise)}`;
}

export function pagePreviewText(p: ListingPreview, unitLabel: string, eff: EffectiveLimits): string {
  const per = perPieceSuffix(unitLabel);
  const range = eff.hasMax
    ? `customers can order ${fmtInt(eff.min)} to ${formatQty(eff.max, unitLabel)}`
    : `customers can order from ${formatQty(eff.min, unitLabel)}`;
  return `opens at ${formatQty(p.qty, unitLabel)} · ${money2(p.unitPaise)}${per} · total ${money2(p.totalPaise)} · ${range}`;
}

/** Read-only "Example" cell: integer paise, no float drift. Null until quantity and price are valid. */
export function exampleText(
  quantity: number,
  price: number,
  mrp: number | null | undefined,
  unitLabel: string,
): string | null {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) return null;
  if (!Number.isFinite(price) || !(price > 0)) return null;
  const total = toPaise(price) * quantity;
  const base = `${formatQty(quantity, unitLabel)} = ${money2(total)}`;
  if (mrp != null && Number.isFinite(mrp) && mrp > price) return `${base} (MRP ${money(toPaise(mrp) * quantity)})`;
  return base;
}

export interface LimitNotes {
  belowLowestTier: string | null;
  unreachableTiers: string[];
  mixedMrp: boolean;
}

export function limitNotes(tiers: readonly QtyTier[], eff: EffectiveLimits, unitLabel = 'pcs'): LimitNotes {
  const valid = tiers.filter((t) => validQty(t.quantity) && Number.isFinite(t.price_per_unit) && t.price_per_unit > 0);
  const lowest = tierForQuantity(valid, 0);
  let belowLowestTier: string | null = null;
  if (lowest && eff.min < lowest.quantity) {
    belowLowestTier = `Orders of ${fmtInt(eff.min)} to ${formatQty(lowest.quantity - 1, unitLabel)} will be charged the ${fmtInt(lowest.quantity)}+ rate (${formatPrice(lowest.price_per_unit)}${perPieceSuffix(unitLabel)})`;
  }
  const unreachableTiers = eff.hasMax
    ? valid.filter((t) => t.quantity > eff.max).map((t) => `Tier ${fmtInt(t.quantity)}+ can never be reached (above the maximum)`)
    : [];
  const withMrp = valid.filter((t) => t.mrp_per_unit != null).length;
  return { belowLowestTier, unreachableTiers, mixedMrp: withMrp > 0 && withMrp < valid.length };
}
