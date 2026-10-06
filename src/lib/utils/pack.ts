export const PACK_SIZE_MAX = 1_000_000;
export const UNIT_LABEL_PATTERN = /^[A-Za-z][A-Za-z0-9 ./-]{0,29}$/;
export const DEFAULT_UNIT_LABEL = 'pcs';
export const UNIT_LABEL_SUGGESTIONS = ['pcs', 'stickers', 'tags', 'sheets', 'cards', 'envelopes'] as const;

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function normalizePackSize(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : 1;
}

export function paiseDividesEvenly(rupees: number, packSize: number): boolean {
  return Number.isFinite(rupees) && toPaise(rupees) % packSize === 0;
}

export function inexactPaiseMessage(rupees: number, packSize: number): string {
  return `₹${rupees} per pack does not divide into whole paise per piece at pack size ${packSize}`;
}

export interface PackTierInput {
  packs: number;
  pack_price: number;
  pack_mrp: number | null;
}

export interface WireTier {
  quantity: number;
  price_per_unit: number;
  mrp_per_unit: number | null;
}

export interface PackTierResult {
  wire: WireTier;
  errors: { packs?: string; pack_price?: string; pack_mrp?: string };
}

/** Pack -> per-unit wire values using integer paise only. When a price is not exact the wire value is rounded so only the pack field reports the problem. */
export function packTierToWire(input: PackTierInput, packSize: number): PackTierResult {
  const errors: PackTierResult['errors'] = {};
  if (!Number.isInteger(input.packs) || input.packs < 1) errors.packs = 'Packs must be a whole number of at least 1';

  const unitFromPack = (rupees: number): number => Math.round(toPaise(rupees) / packSize) / 100;

  if (Number.isFinite(input.pack_price) && !paiseDividesEvenly(input.pack_price, packSize)) {
    errors.pack_price = inexactPaiseMessage(input.pack_price, packSize);
  }
  const mrp = input.pack_mrp;
  if (mrp != null && Number.isFinite(mrp) && !paiseDividesEvenly(mrp, packSize)) {
    errors.pack_mrp = inexactPaiseMessage(mrp, packSize);
  }

  return {
    wire: {
      quantity: input.packs * packSize,
      price_per_unit: Number.isFinite(input.pack_price) ? unitFromPack(input.pack_price) : NaN,
      mrp_per_unit: mrp != null && Number.isFinite(mrp) ? unitFromPack(mrp) : null,
    },
    errors,
  };
}

/** Per-unit wire -> pack inputs. `packs` may be fractional for legacy data; the form then flags the row instead of rounding it. */
export function wireTierToPack(tier: WireTier, packSize: number): PackTierInput {
  return {
    packs: tier.quantity / packSize,
    pack_price: (toPaise(tier.price_per_unit) * packSize) / 100,
    pack_mrp: tier.mrp_per_unit != null ? (toPaise(tier.mrp_per_unit) * packSize) / 100 : null,
  };
}

/** Rupees per piece for a pack price, or null when it is not a whole number of paise. */
export function perPieceRupees(packPrice: number, packSize: number): number | null {
  if (!paiseDividesEvenly(packPrice, packSize)) return null;
  return toPaise(packPrice) / packSize / 100;
}

export function formatPacks(quantity: number, packSize: number, unitLabel: string): string {
  if (packSize <= 1) return String(quantity);
  const packs = quantity / packSize;
  return `${packs} ${packs === 1 ? 'pack' : 'packs'} (${quantity} ${unitLabel})`;
}

/** Display-only pack price in rupees (integer paise, no float multiplication). */
export function packPrice(unitPrice: number, packSize: number): number {
  return (toPaise(unitPrice) * packSize) / 100;
}

export interface OptionRoundingNote {
  label: string;
  packPrice: number;
}

/** Options whose multiplier makes unit price x multiplier non-exact in paise; the charge is the rounded unit price x quantity. */
export function optionRoundingNotes(
  unitPrice: number,
  packSize: number,
  options: ReadonlyArray<{ label: string; price_multiplier: number; is_active?: boolean }>,
): OptionRoundingNote[] {
  if (!Number.isFinite(unitPrice) || packSize <= 1) return [];
  const unitPaise = toPaise(unitPrice);
  const notes: OptionRoundingNote[] = [];
  for (const o of options) {
    if (o.is_active === false || !Number.isFinite(o.price_multiplier)) continue;
    const m = Math.round(o.price_multiplier * 10000);
    const scaled = unitPaise * m;
    if (scaled % 10000 === 0) continue;
    const roundedUnitPaise = Math.floor((scaled + 5000) / 10000);
    notes.push({ label: o.label, packPrice: (roundedUnitPaise * packSize) / 100 });
  }
  return notes;
}
