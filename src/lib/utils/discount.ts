// Integer-paise, HALF_UP arithmetic. Mirrors the backend's Decimal ROUND_HALF_UP
// rule so the live preview never disagrees with what the server stores/displays.

export function toPaise(rupees: number): number {
  // toPrecision strips binary float noise (1.005 * 100 = 100.49999999999999) before rounding.
  return Math.round(Number((rupees * 100).toPrecision(12)));
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

function divHalfUp(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

/** Whole-percent discount, HALF_UP. Returns 0 when it rounds to 0 or the inputs are not a valid discount. */
export function discountPercent(mrp: number, price: number): number {
  const mrpP = toPaise(mrp);
  const priceP = toPaise(price);
  if (!(mrpP > 0) || !(priceP > 0) || mrpP <= priceP) return 0;
  return divHalfUp((mrpP - priceP) * 100, mrpP);
}

/** Percent to show in the UI: null when there is no discount or it rounds to 0 (badge hidden). */
export function displayDiscountPercent(mrp: number | null | undefined, price: number | null | undefined): number | null {
  if (mrp == null || price == null) return null;
  const pct = discountPercent(mrp, price);
  return pct >= 1 ? pct : null;
}

/** Per-unit saving in rupees (exact to the paisa), 0 when not a discount. */
export function discountAmount(mrp: number, price: number): number {
  const mrpP = toPaise(mrp);
  const priceP = toPaise(price);
  if (!(mrpP > priceP) || !(priceP > 0)) return 0;
  return fromPaise(mrpP - priceP);
}

/** Selling price for `percent` off `mrp` (percent may carry up to 2 decimals), HALF_UP to the paisa. */
export function priceForPercentOff(mrp: number, percent: number): number {
  const mrpP = toPaise(mrp);
  const basisPoints = Math.round(percent * 100);
  const remaining = 10000 - basisPoints;
  return fromPaise(divHalfUp(mrpP * remaining, 10000));
}

export function hasAtMostTwoDecimals(n: number): boolean {
  return Math.abs(n * 100 - Math.round(n * 100)) < 1e-7;
}
