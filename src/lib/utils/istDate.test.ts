import { describe, expect, it } from 'vitest';
import { formatIst, istLocalToUtcIso, sameInstant, utcIsoToIstLocal } from './istDate';

describe('IST <-> UTC', () => {
  it('converts IST wall clock to UTC (+05:30)', () => {
    expect(istLocalToUtcIso('2026-10-03T12:00')).toBe('2026-10-03T06:30:00.000Z');
  });

  it('crosses midnight backwards: 00:15 IST is the previous UTC day', () => {
    expect(istLocalToUtcIso('2026-10-03T00:15')).toBe('2026-10-02T18:45:00.000Z');
  });

  it('crosses midnight forwards: 23:45 UTC is 05:15 IST the next day', () => {
    expect(utcIsoToIstLocal('2026-10-02T23:45:00Z')).toBe('2026-10-03T05:15');
  });

  it('handles month and year boundaries', () => {
    expect(istLocalToUtcIso('2027-01-01T03:00')).toBe('2026-12-31T21:30:00.000Z');
    expect(utcIsoToIstLocal('2026-12-31T20:00:00Z')).toBe('2027-01-01T01:30');
  });

  it('round-trips', () => {
    const iso = istLocalToUtcIso('2026-03-29T01:30');
    expect(utcIsoToIstLocal(iso)).toBe('2026-03-29T01:30');
  });

  it('has no DST shift across the year', () => {
    expect(istLocalToUtcIso('2026-01-15T12:00')).toBe('2026-01-15T06:30:00.000Z');
    expect(istLocalToUtcIso('2026-07-15T12:00')).toBe('2026-07-15T06:30:00.000Z');
  });

  it('returns null / empty for blank or invalid input', () => {
    expect(istLocalToUtcIso('')).toBeNull();
    expect(istLocalToUtcIso(null)).toBeNull();
    expect(istLocalToUtcIso('not-a-date')).toBeNull();
    expect(utcIsoToIstLocal(null)).toBe('');
    expect(utcIsoToIstLocal('garbage')).toBe('');
  });

  it('formats with an explicit IST label', () => {
    expect(formatIst('2026-10-03T06:30:00Z')).toBe('2026-10-03 12:00 IST');
  });

  it('compares instants regardless of formatting', () => {
    expect(sameInstant('2026-10-03T06:30:00Z', '2026-10-03T06:30:00.000Z')).toBe(true);
    expect(sameInstant(null, null)).toBe(true);
    expect(sameInstant(null, '2026-10-03T06:30:00Z')).toBe(false);
  });
});
