const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

/** "All products" | "3 products and 1 category" | "2 categories". */
export function couponScopeSummary(productIds: readonly string[], categoryIds: readonly string[]): string {
  const p = productIds.length;
  const c = categoryIds.length;
  if (p === 0 && c === 0) return 'All products';
  const parts: string[] = [];
  if (p > 0) parts.push(plural(p, 'product', 'products'));
  if (c > 0) parts.push(plural(c, 'category', 'categories'));
  return parts.join(' and ');
}

export const SCOPE_HELP =
  'A product is eligible if it is on the product list or in a listed category. The minimum order still counts the whole cart, but the discount is taken from eligible items only.';
