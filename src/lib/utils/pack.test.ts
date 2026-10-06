import { describe, expect, it } from 'vitest';
import {
  formatPacks, normalizePackSize, optionRoundingNotes, packPrice, packTierToWire, perPieceRupees, wireTierToPack,
} from './pack';

describe('packTierToWire', () => {
  it('rupees 300 per pack of 50 -> 6.00 per piece, quantity in pieces', () => {
    const r = packTierToWire({ packs: 3, pack_price: 300, pack_mrp: 375 }, 50);
    expect(r.errors).toEqual({});
    expect(r.wire).toEqual({ quantity: 150, price_per_unit: 6, mrp_per_unit: 7.5 });
  });

  it('rupees 100 per pack of 30 is rejected with the exactness message', () => {
    const r = packTierToWire({ packs: 1, pack_price: 100, pack_mrp: null }, 30);
    expect(r.errors.pack_price).toBe('₹100 per pack does not divide into whole paise per piece at pack size 30');
  });

  it('rupees 99 and 102 per pack of 30 are accepted (3.30 and 3.40)', () => {
    expect(packTierToWire({ packs: 1, pack_price: 99, pack_mrp: null }, 30).wire.price_per_unit).toBe(3.3);
    expect(packTierToWire({ packs: 1, pack_price: 102, pack_mrp: null }, 30).wire.price_per_unit).toBe(3.4);
  });

  it('is exact in paise where float division is not (19.99 * 100 style values)', () => {
    expect(packTierToWire({ packs: 1, pack_price: 1.15, pack_mrp: null }, 5).errors).toEqual({});
    expect(packTierToWire({ packs: 1, pack_price: 1.15, pack_mrp: null }, 5).wire.price_per_unit).toBe(0.23);
    expect(packTierToWire({ packs: 1, pack_price: 0.07, pack_mrp: null }, 2).errors.pack_price).toBeDefined();
  });

  it('rejects an inexact MRP on the MRP field only', () => {
    const r = packTierToWire({ packs: 1, pack_price: 99, pack_mrp: 100 }, 30);
    expect(r.errors.pack_mrp).toBeDefined();
    expect(r.errors.pack_price).toBeUndefined();
  });

  it('rejects zero, negative and fractional pack counts', () => {
    for (const packs of [0, -1, 1.5, NaN]) {
      expect(packTierToWire({ packs, pack_price: 300, pack_mrp: null }, 50).errors.packs).toBeDefined();
    }
  });
});

describe('wireTierToPack round trip', () => {
  const cases: Array<[number, number, number | null, number]> = [
    [50, 6, 7.5, 50],
    [100, 5.8, null, 50],
    [250, 0.37, null, 50],
    [75, 3.3, 3.4, 25],
    [30, 3.3, null, 30],
    [1000, 0.01, null, 1000],
  ];
  it.each(cases)('qty %s unit %s mrp %s pack %s survives pack -> wire unchanged', (quantity, price, mrp, size) => {
    const pack = wireTierToPack({ quantity, price_per_unit: price, mrp_per_unit: mrp }, size);
    const back = packTierToWire(pack, size);
    expect(back.errors).toEqual({});
    expect(back.wire).toEqual({ quantity, price_per_unit: price, mrp_per_unit: mrp });
  });

  it('leaves a non-multiple legacy quantity fractional so the form can flag it', () => {
    const pack = wireTierToPack({ quantity: 120, price_per_unit: 6, mrp_per_unit: null }, 50);
    expect(pack.packs).toBe(2.4);
    expect(packTierToWire(pack, 50).errors.packs).toBeDefined();
  });
});

describe('helpers', () => {
  it('perPieceRupees', () => {
    expect(perPieceRupees(300, 50)).toBe(6);
    expect(perPieceRupees(100, 30)).toBeNull();
  });
  it('packPrice uses integer paise', () => {
    expect(packPrice(0.37, 50)).toBe(18.5);
    expect(packPrice(6, 50)).toBe(300);
  });
  it('formatPacks', () => {
    expect(formatPacks(150, 50, 'pcs')).toBe('3 packs (150 pcs)');
    expect(formatPacks(50, 50, 'tags')).toBe('1 pack (50 tags)');
    expect(formatPacks(100, 1, 'pcs')).toBe('100');
  });
  it('normalizePackSize', () => {
    expect(normalizePackSize(undefined)).toBe(1);
    expect(normalizePackSize(NaN)).toBe(1);
    expect(normalizePackSize(0)).toBe(1);
    expect(normalizePackSize(50)).toBe(50);
  });
  it('optionRoundingNotes flags only non-exact multipliers', () => {
    const notes = optionRoundingNotes(6.01, 50, [
      { label: 'Matte', price_multiplier: 1.05 },
      { label: 'Plain', price_multiplier: 1 },
      { label: 'Off', price_multiplier: 1.05, is_active: false },
    ]);
    expect(notes).toEqual([{ label: 'Matte', packPrice: 315.5 }]);
    expect(optionRoundingNotes(6, 1, [{ label: 'x', price_multiplier: 1.0001 }])).toEqual([]);
  });
});
