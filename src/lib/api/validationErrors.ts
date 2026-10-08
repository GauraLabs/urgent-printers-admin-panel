export interface ValidationFieldError {
  /** Dotted form path, e.g. `pricing_tiers.0.price_per_unit`. */
  path: string;
  message: string;
}

const NUMERIC = /^\d+$/;

function cleanMessage(msg: string): string {
  return msg.replace(/^Value error,\s*/i, '');
}

/** `pricing_tiers.0.price_per_unit` -> `Pricing tiers #1 price per unit`. */
export function humanizePath(path: string): string {
  const parts = path.split('.').filter(Boolean).map((p) => (NUMERIC.test(p) ? `#${Number(p) + 1}` : p.replace(/_/g, ' ')));
  const text = parts.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Pulls `{ path, message }` pairs out of FastAPI's pydantic `detail: [{loc, msg, type}]` shape. */
export function parseValidationDetail(detail: unknown): ValidationFieldError[] {
  if (!Array.isArray(detail)) return [];
  const out: ValidationFieldError[] = [];
  for (const item of detail) {
    if (!item || typeof item !== 'object' || !('msg' in item)) continue;
    const loc = (item as { loc?: unknown[] }).loc;
    const path = Array.isArray(loc) ? loc.filter((p) => p !== 'body').map(String).join('.') : '';
    out.push({ path, message: cleanMessage(String((item as { msg: unknown }).msg)) });
  }
  return out;
}

export function formatValidationDetail(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail;
  const fields = parseValidationDetail(detail);
  if (fields.length === 0) return undefined;
  return fields.map((f) => (f.path ? `${humanizePath(f.path)}: ${f.message}` : f.message)).join('; ');
}

const CODED_MESSAGES: Record<string, string> = {
  invalid_coupon_value: 'The coupon discount value is outside the allowed range. Percentage must be above 0 and at most 100; a fixed amount must be above 0.',
  invalid_option: 'One of the print options is invalid or inactive. Check option multipliers (0.01–100) and that each option group has an active default.',
  invalid_turnaround: 'A turnaround option has an extra cost outside the allowed range of 0 to 100000.',
  product_unavailable: 'This product is not available (it may be archived, inactive or have invalid pricing).',
  invalid_order_total: 'This order has an invalid total, usually caused by a price or coupon outside the allowed range.',
  product_unpriceable: 'The cheapest combination of tier price and option multipliers would cost less than ₹0.01 per unit. Raise the lowest tier price or the smallest option multiplier.',
  quantity_limits_invalid: 'The order quantity limits are inconsistent. The minimum cannot exceed the maximum, and the show-on-listing quantity must sit between them.',
  quantity_below_minimum: 'The quantity is below the minimum order for this product.',
  quantity_above_maximum: 'The quantity is above the maximum order for this product.',
  invalid_coupon_scope: 'One or more of the selected products or categories no longer exist. Remove them from "Applies to" and try again.',
  duplicate_option_label: 'Two options in the same group have the same name (ignoring case, spaces and punctuation). Give each option a unique label.',
  invalid_mrp: 'MRP must be greater than the selling price and have at most 2 decimal places',
};

/** Friendly text for a backend error code, or undefined when the code is not one we know. */
export function codedErrorMessage(code: string | undefined): string | undefined {
  return code ? CODED_MESSAGES[code] : undefined;
}

export function describeApiError(err: unknown, fallback: string): string {
  const e = err as { code?: string; message?: string; status?: number } | undefined;
  const coded = codedErrorMessage(e?.code);
  if (coded) return coded;
  if ((e?.status === 422 || e?.status === 409) && e.message) return e.message;
  return fallback;
}

export type OptionGroup = 'sizes' | 'paper_types' | 'finishes' | 'sides_options';

const OPTION_GROUP_PREFIX = /^Duplicate (sizes|paper_types|finishes|sides_options) option label/;

/** Parses the category from the backend's `Duplicate {category} option label '{label}'` message. */
export function optionGroupFromMessage(message: string | undefined): OptionGroup | undefined {
  const m = OPTION_GROUP_PREFIX.exec(message ?? '');
  return m ? (m[1] as OptionGroup) : undefined;
}

export type QuantityLimitField = 'listing_quantity' | 'min_order_quantity' | 'max_order_quantity';

/** Picks the form field a `quantity_limits_invalid` message is about. */
export function quantityLimitFieldFromMessage(message: string | undefined): QuantityLimitField {
  const m = (message ?? '').toLowerCase();
  if (m.includes('show-on-listing') || m.includes('listing')) return 'listing_quantity';
  if (m.includes('maximum order must be at most') || m.startsWith('maximum order')) return 'max_order_quantity';
  return 'min_order_quantity';
}
