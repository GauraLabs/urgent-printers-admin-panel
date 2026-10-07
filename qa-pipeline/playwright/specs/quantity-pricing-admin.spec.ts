// Hand-authored — see pipeline/README.md's "The hand-authoring fallback". The MCP-driven
// Generator agent is additionally unsuitable here because it drives a live browser while
// generating, and `POST /admin/auth/login` is rate-limited to 10/hour/IP — generation alone
// would exhaust the budget this capture needs.
//
// Grounded in: ProductForm/PricingSection.tsx (every id/data-testid below is literal from
// that file), ProductForm/DiscountPreview.tsx, ProductForm/schema.ts (message copy),
// ProductForm/index.tsx (Section titles, 'Save Changes' for an existing product, and the
// 3-photo save guard), src/lib/utils/orderQuantity.ts (preview/note strings).
//
// Deliberately TWO tests, not seven: each Playwright test gets its own context hence its own
// login, so every path that can share a session does.
import { test, expect } from '../capture.js';
import type { Locator } from '@playwright/test';

const PLAN = 'qa-pipeline/artifacts/plans/quantity-pricing-admin-plan.json';

const ADMIN_EMAIL = 'admin@urgentprinters.com';
const ADMIN_PASSWORD = 'SuperAdmin@123';

/** Custom Die-Cut Stickers — the only real dev product with the 3 photos save() demands. */
const STICKERS_ID = 16;
/** Matte Finish Business Cards — 1 photo, so read-only here; listing_quantity stored as 250. */
const CARDS_ID = 10;

test.use({
  captureOptions: {
    feature: 'Quantity Pricing Admin',
    plan: PLAN,
    axe: 'per-navigation',
    // Lighthouse is structurally unreliable on this app: the access token is in-memory only,
    // so a post-login checkpoint gets redirected to /login (pipeline/README.md, per-app wrinkles).
    lighthouse: 'off',
  },
});

async function login(page: import('@playwright/test').Page, capture: any) {
  await capture.step('auth-01', 'Open the admin login page', null, () => page.goto('/login'));
  await capture.type('auth-02', 'Enter the admin email', page.locator('#email'), ADMIN_EMAIL);
  await capture.type('auth-03', 'Enter the admin password', page.locator('#password'), ADMIN_PASSWORD);
  await capture.step('auth-04', 'Submit the login form', page.getByRole('button', { name: 'Sign in' }), async (el: Locator) => {
    await el.click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
  });
}

/** Wait for the product edit form to hydrate — the tier rows are the last thing to land. */
async function openProduct(page: import('@playwright/test').Page, id: number) {
  await page.goto(`/products/${id}`);
  await expect(page.locator('#order-quantity')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('input[aria-label="Quantity for pricing tier 1"]')).not.toHaveValue('', { timeout: 30_000 });
}

/**
 * Scroll a step's subject into the viewport before capture.step() measures and screenshots it.
 *
 * capture.js measures the bounding box BEFORE running the step body and screenshots the
 * current viewport afterwards. Playwright's assertions don't scroll (only actionability does),
 * so without this every pricing-section step was screenshotted showing "Basic Information" at
 * the top of a very long form — useless as documentation, and the box lands outside the
 * 1280x720 viewport so validate.mjs rejects the run.
 */
async function bringIntoView(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
}

const previewCard = (page: import('@playwright/test').Page) => page.locator('[data-testid="preview-card"]');
const previewPage = (page: import('@playwright/test').Page) => page.locator('[data-testid="preview-page"]');
const limitNotes = (page: import('@playwright/test').Page) => page.locator('[data-testid="limit-notes"]');
const saveButton = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Save Changes' });

test.describe('Quantity Pricing (Admin) — pricing table and Order quantity panel', () => {
  test.describe.configure({ timeout: 600_000 });

  test('simple per-piece table, automatic defaults, live preview, validation and save', async ({ page, capture }) => {
    await login(page, capture);

    // ── hp-01: the table is back to plain per-piece columns ──
    await capture.step('hp-01', 'Open Custom Die-Cut Stickers and read the pricing table header', null, async () => {
      await openProduct(page, STICKERS_ID);
      await bringIntoView(page.locator('thead'));
      await expect(page.locator('thead th')).toHaveText([
        'Quantity from',
        'Price per piece (₹)',
        'MRP per piece (₹, optional)',
        'Discount',
        'Example',
        'Best value',
        '',
      ]);
    });

    // ── hp-02: no pack UI or pack copy survives anywhere in the form ──
    await capture.step('hp-02', 'Confirm every pack control and pack string is gone', page.locator('form'), async () => {
      // Scope to the form itself: the surrounding chrome (sidebar, header) is not this
      // feature's surface, and a blanket page-wide /pack/i would be a false positive waiting
      // to happen on unrelated copy.
      const formText = await page.locator('form').innerText();
      for (const forbidden of ['Pack size', 'pack size', 'Price per pack', 'per pack', 'packis', 'Packs', 'Total (₹)']) {
        expect(formText, `"${forbidden}" still appears in the product form`).not.toContain(forbidden);
      }
      // The blanket "no pack vocabulary at all" check is scoped to the pricing section: the
      // form as a whole legitimately contains the product's own description, which for this
      // product reads "...great for branding and packaging".
      const pricingText = await page.locator('[data-field="pricing_tiers"]').innerText();
      expect(pricingText, 'some pack wording survives in the pricing section').not.toMatch(/pack/i);
    });

    // ── hp-03: the DiscountPreview bug fix — a dash, not a bare price ──
    await bringIntoView(page.locator('tbody tr').first());
    await capture.step('hp-03', 'Read the Discount cell of a tier with no MRP', page.locator('tbody tr').first().locator('td').nth(3), async (el) => {
      await expect(el).toHaveText('—');
      // The old bug rendered formatPrice(price) here; ₹6.00 must not appear in this cell.
      await expect(el).not.toContainText('₹');
      // No "% off" helper input on an MRP-less row.
      await expect(el.locator('input')).toHaveCount(0);
    });

    // ── hp-04: the read-only Example column ──
    await bringIntoView(page.locator('[data-testid="tier-example"]').first());
    await capture.step('hp-04', 'Read the Example cells for the 50 and 250 tiers', page.locator('[data-testid="tier-example"]').first(), async () => {
      const examples = page.locator('[data-testid="tier-example"]');
      await expect(examples.nth(0)).toHaveText('50 pcs = ₹300.00');
      await expect(examples.nth(2)).toHaveText('250 pcs = ₹1,500.00');
    });

    // ── hp-05: every limit field starts automatic, nothing is required ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('hp-05', 'Read the Order quantity panel in its automatic state', page.locator('#order-quantity'), async () => {
      // listing_quantity is STORED as 50 on this product: migration f5b2d9c4a713's data step
      // (`UPDATE products SET listing_quantity = pack_size WHERE ... pack_size > 1`) copied
      // its retired pack size across, exactly as spec section 2 requires. So it reads as a
      // set value with "Reset to auto", while min and max are genuinely automatic.
      await expect(page.locator('#listing-quantity-input')).toHaveValue('50');
      await expect(page.locator('[data-testid="listing_quantity-auto"]')).toHaveCount(0);
      await expect(page.locator('[data-field="listing_quantity"]')).toContainText('Reset to auto');
      await expect(page.locator('#min-order-input')).toHaveValue('');
      await expect(page.locator('#max-order-input')).toHaveValue('');
      await expect(page.locator('[data-testid="min_order_quantity-auto"]')).toHaveText('Auto');
      await expect(page.locator('[data-testid="max_order_quantity-auto"]')).toHaveText('Auto');
      await expect(page.locator('#min-order-input')).toHaveAttribute('placeholder', '50 (auto)');
      await expect(page.locator('#max-order-input')).toHaveAttribute('placeholder', 'No limit');
      await expect(page.locator('#unit-name-input')).toHaveValue('pcs');
      await expect(page.locator('#order-quantity')).toContainText('Shown after quantities, e.g. 40 pcs');
    });

    // ── hp-06: helper copy and the live preview, in the no-maximum wording ──
    await bringIntoView(page.locator('[data-testid="listing-preview"]'));
    await capture.step('hp-06', 'Read the panel helper line and the live preview', page.locator('[data-testid="listing-preview"]'), async () => {
      await expect(page.locator('#order-quantity')).toContainText(
        'Customers can order any quantity between the minimum and the maximum. The price follows the ‘Quantity from’ tiers below.',
      );
      await expect(previewCard(page)).toHaveText('Product card: 50 pcs for ₹300.00');
      await expect(previewPage(page)).toHaveText(
        'Product page: opens at 50 pcs · ₹6.00/pc · total ₹300.00 · customers can order from 50 pcs',
      );
      // This product has non-1.0 option multipliers (sizes x1.6/x2.4, paper x1.3), so the
      // disclosure line must be present. The cheapest option in every group is still 1.0,
      // which is why the advertised price nonetheless equals the PDP's default-option price.
      await expect(page.locator('[data-testid="preview-options"]')).toHaveText(
        'Price from options: shown for the cheapest options',
      );
    });

    // ── edge-01: NOTHING warns that the per-piece rate rises with quantity ──
    await bringIntoView(page.locator('[data-field="pricing_tiers"]'));
    await capture.step('edge-01', 'Confirm a rising per-piece rate raises no warning at all', page.locator('[data-field="pricing_tiers"]'), async () => {
      // Dev data prices the 100 tier at ₹10/pc against ₹6/pc at the 50 tier — so a customer
      // who buys more pays more per piece, and the storefront tier guide renders that
      // faithfully. getTierPriceTypoWarnings only fires above a 10x ratio (BOUNDS.TYPO_TIER_RATIO,
      // schema.ts), and 10/6 = 1.67, so no warning appears; limitNotes covers
      // below-lowest-tier / unreachable-tier / mixed-MRP but not a non-decreasing rate.
      // Asserted as the CURRENT behaviour and reported as a coverage gap, not a spec defect:
      // the spec only requires the existing typo/floor warnings to be kept.
      await expect(page.locator('[data-testid="tier-typo-warning"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="tier-example"]').nth(0)).toHaveText('50 pcs = ₹300.00');
      await expect(page.locator('[data-testid="tier-example"]').nth(1)).toHaveText('100 pcs = ₹1,000.00');
    });

    // ── alt-03: a minimum below the lowest tier is a NOTE, never an error ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('alt-03', 'Type a minimum of 25, below the lowest tier of 50', page.locator('#min-order-input'), async (el) => {
      await el.fill('25');
      await expect(limitNotes(page)).toContainText(
        'Orders of 25 to 49 pcs will be charged the 50+ rate (₹6.00/pc)',
      );
      // Must not be a validation error: no message under the field.
      await expect(page.locator('[data-field="min_order_quantity"] p')).toHaveCount(0);
    });

    // ── alt-04: tiers above the maximum are unreachable NOTES, not errors ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('alt-04', 'Type a maximum of 200, below several tier quantities', page.locator('#max-order-input'), async (el) => {
      await page.locator('#min-order-input').fill('');
      await el.fill('200');
      await expect(limitNotes(page)).toContainText('Tier 250+ can never be reached (above the maximum)');
      await expect(limitNotes(page)).toContainText('Tier 500+ can never be reached (above the maximum)');
      await expect(limitNotes(page)).toContainText('Tier 1,000+ can never be reached (above the maximum)');
      await expect(page.locator('[data-field="max_order_quantity"] p')).toHaveCount(0);
    });

    // ── err-01: min greater than max blocks the save ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('err-01', 'Set min 500 / max 100 and attempt to save', saveButton(page), async (el) => {
      await page.locator('#min-order-input').fill('500');
      await page.locator('#max-order-input').fill('100');
      let patched = false;
      const watch = (r: import('@playwright/test').Request) => {
        if (r.method() === 'PATCH' && r.url().includes('/admin/products/')) patched = true;
      };
      page.on('request', watch);
      await el.click();
      await expect(page.locator('[data-field="min_order_quantity"]')).toContainText(
        'Minimum order cannot be more than the maximum',
      );
      await page.waitForTimeout(1000);
      page.off('request', watch);
      expect(patched, 'a PATCH was issued despite min > max').toBe(false);
    });

    // ── err-02: a listing quantity outside the range blocks the save and dashes the preview ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('err-02', 'Set listing 5,000 against a maximum of 1,000 and attempt to save', saveButton(page), async (el) => {
      await page.locator('#min-order-input').fill('');
      await page.locator('#max-order-input').fill('1000');
      await page.locator('#listing-quantity-input').fill('5000');
      // The preview does NOT dash here: effectiveLimits() clamps the listing quantity into
      // [min, max] exactly as spec section 1 defines effective_listing, so the preview shows
      // what WOULD happen (1,000 pcs, the clamped value) rather than the rejected 5,000.
      // Recorded as the real behaviour; the mild UX oddity — a preview priced for a quantity
      // the form will refuse to save — is reported as a note, not failed as a defect.
      await expect(previewCard(page)).toHaveText('Product card: 1,000 pcs for ₹2,500.00');
      await expect(previewPage(page)).toContainText('opens at 1,000 pcs');
      await el.click();
      await expect(page.locator('[data-field="listing_quantity"]')).toContainText(
        'Show-on-listing quantity must be between 50 and 1,000',
      );
    });

    // ── err-03: the 1,000,000 ceiling ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('err-03', 'Set a maximum of 1,000,001 and attempt to save', saveButton(page), async (el) => {
      await page.locator('#listing-quantity-input').fill('');
      await page.locator('#max-order-input').fill('1000001');
      await el.click();
      await expect(page.locator('[data-field="max_order_quantity"]')).toContainText(/1,000,000|1000000/);
    });

    // ── err-04: non-integer quantities ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('err-04', 'Type a fractional minimum of 50.5 and attempt to save', saveButton(page), async (el) => {
      await page.locator('#max-order-input').fill('');
      await page.locator('#min-order-input').fill('50.5');
      await el.click();
      await expect(page.locator('[data-field="min_order_quantity"]')).toContainText(
        'Enter a whole number from 1 to 1,000,000',
      );
    });

    // ── alt-02: "Reset to auto" round-trips a field back to automatic ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('alt-02', 'Clear the minimum with Reset to auto', page.locator('[data-field="min_order_quantity"] button'), async () => {
      await page.locator('#min-order-input').fill('250');
      await expect(page.locator('[data-testid="min_order_quantity-auto"]')).toHaveCount(0);
      await page.locator('[data-field="min_order_quantity"]').getByRole('button', { name: 'Reset to auto' }).click();
      await expect(page.locator('#min-order-input')).toHaveValue('');
      await expect(page.locator('[data-testid="min_order_quantity-auto"]')).toHaveText('Auto');
      await expect(previewCard(page)).toHaveText('Product card: 50 pcs for ₹300.00');
    });

    // ── hp-07: setting a maximum updates the preview's range clause only ──
    await bringIntoView(page.locator('[data-testid="listing-preview"]'));
    await capture.step('hp-07', 'Set a maximum of 1,000 and watch the preview range update', page.locator('#max-order-input'), async (el) => {
      // Restore the stored listing quantity the error paths above cleared, so this save
      // changes exactly one thing: the maximum.
      await page.locator('#listing-quantity-input').fill('50');
      await el.fill('1000');
      await expect(previewPage(page)).toHaveText(
        'Product page: opens at 50 pcs · ₹6.00/pc · total ₹300.00 · customers can order 50 to 1,000 pcs',
      );
      // A maximum changes no price, so the card line must be untouched.
      await expect(previewCard(page)).toHaveText('Product card: 50 pcs for ₹300.00');
      await expect(page.locator('[data-testid="max_order_quantity-auto"]')).toHaveCount(0);
    });

    // ── hp-08: save, and assert the exact payload shape ──
    await capture.step('hp-08', 'Save the product with the maximum set', saveButton(page), async (el) => {
      const [request] = await Promise.all([
        page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/admin/products/'), { timeout: 30_000 }),
        el.click(),
      ]);
      const body = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
      expect(body.max_order_quantity).toBe(1000);
      expect(body.min_order_quantity).toBeNull();
      expect(body.listing_quantity).toBe(50);
      expect('pack_size' in body, 'the form still sends the retired pack_size key').toBe(false);
      expect('quantity_steps' in body, 'the form still sends the deprecated quantity_steps key').toBe(false);
      await expect(page.getByText('Product updated').first()).toBeVisible({ timeout: 30_000 });
    });

    // ── hp-12: the products LIST carries no pack wording either ──
    await capture.step('hp-12', 'Check the products list for any surviving pack column or wording', null, async () => {
      await page.goto('/products');
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('tbody tr [data-slot="skeleton"]')).toHaveCount(0, { timeout: 30_000 });
      const headers = await page.locator('thead th').allInnerTexts();
      for (const h of headers) {
        expect(h, `products-list column "${h}" still mentions packs`).not.toMatch(/pack/i);
      }
      const tableText = await page.locator('table').innerText();
      for (const forbidden of ['per pack', 'Pack of', 'pack of', 'Pack size']) {
        expect(tableText, `"${forbidden}" still appears in the products list`).not.toContain(forbidden);
      }
    });

    // ── err-05: an untouched product saves with nothing changed ──
    await capture.step('err-05', 'Reopen the product and save without changing anything', saveButton(page), async (el) => {
      await openProduct(page, STICKERS_ID);
      await bringIntoView(page.locator('#order-quantity'));
      // The saved maximum round-trips into the form as a real value, not as Auto.
      await expect(page.locator('#max-order-input')).toHaveValue('1000');
      await expect(page.locator('#listing-quantity-input')).toHaveValue('50');
      await expect(page.locator('#min-order-input')).toHaveValue('');
      const [request] = await Promise.all([
        page.waitForRequest((r) => r.method() === 'PATCH' && r.url().includes('/admin/products/'), { timeout: 30_000 }),
        el.click(),
      ]);
      const body = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
      // Automatic must stay automatic — never materialised into its derived number.
      expect(body.min_order_quantity).toBeNull();
      expect(body.listing_quantity).toBe(50);
      expect(body.max_order_quantity).toBe(1000);
      expect('pack_size' in body).toBe(false);
      await expect(page.getByText('Product updated').first()).toBeVisible({ timeout: 30_000 });
    });
  });

  // Its own feature name so it writes its own run log: two tests sharing one captureOptions
  // feature make the second clobber-or-rename the first's file (capture.js's writtenRunLogs
  // guard), which makes the Analyzer's inputs depend on test execution order.
  test.describe('discount rendering and save guards', () => {
    test.use({
      captureOptions: {
        feature: 'Quantity Pricing Admin Discount And Guards',
        plan: PLAN,
        axe: 'per-navigation',
        lighthouse: 'off',
      },
    });

  test('a real MRP discount, a stored listing quantity, and the photo guard', async ({ page, capture }) => {
    await login(page, capture);

    // ── hp-09: a tier WITH an MRP renders the full discount ──
    await capture.step('hp-09', 'Open Matte Finish Business Cards and read a Discount cell that has an MRP', page.locator('[data-testid="discount-preview"]').first(), async (el) => {
      await openProduct(page, CARDS_ID);
      await bringIntoView(page.locator('[data-testid="discount-preview"]').first());
      await expect(el).toContainText('10% off');
      // Proves hp-03's dash is a no-MRP rule, not a broken component.
      // Money in this section must read ₹14.00 / ₹12.60 — two decimals, matching the spec's
      // own worked examples and the storefront, which always formats to two.
      await expect(el.locator('s')).toHaveText('₹14.00');
      await expect(el).toContainText('₹12.60');
    });

    // ── hp-10: the panel hydrates from the STORED values, so 'set' reads differently from 'auto' ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('hp-10', 'Read the Order quantity panel with a stored listing quantity', page.locator('#order-quantity'), async () => {
      await expect(page.locator('#listing-quantity-input')).toHaveValue('250');
      await expect(page.locator('[data-testid="listing_quantity-auto"]')).toHaveCount(0);
      await expect(page.locator('[data-field="listing_quantity"]')).toContainText('Reset to auto');
      await expect(page.locator('#min-order-input')).toHaveValue('');
      await expect(page.locator('#max-order-input')).toHaveValue('');
      await expect(page.locator('[data-testid="min_order_quantity-auto"]')).toHaveText('Auto');
      await expect(page.locator('#min-order-input')).toHaveAttribute('placeholder', '100 (auto)');
    });

    // ── hp-11: the preview is what the storefront then renders ──
    await bringIntoView(page.locator('[data-testid="listing-preview"]'));
    await capture.step('hp-11', 'Read the live preview for comparison with the storefront', page.locator('[data-testid="listing-preview"]'), async () => {
      // The card preview's parts are adjacent inline elements with no whitespace text nodes
      // between them, so assert the parts rather than one brittle concatenated string.
      await expect(previewCard(page)).toContainText('250 pcs for ₹2,250.00');
      await expect(previewCard(page).locator('s')).toHaveText('₹2,500.00');
      await expect(previewCard(page)).toContainText('10% off');
      await expect(previewPage(page)).toHaveText(
        'Product page: opens at 250 pcs · ₹9.00/pc · total ₹2,250.00 · customers can order from 100 pcs',
      );
      await expect(page.locator('[data-testid="preview-options"]')).toHaveText(
        'Price from options: shown for the cheapest options',
      );
    });

    // ── alt-05: a partially-filled MRP set warns that card and PDP could disagree ──
    await bringIntoView(page.locator('#order-quantity'));
    await capture.step('alt-05', 'Clear the MRP on one tier and read the mixed-MRP note', page.locator('input[aria-label="MRP per unit for pricing tier 2"]'), async (el) => {
      await el.fill('');
      await expect(limitNotes(page)).toContainText(
        'Add an MRP to every tier so the card discount matches the product page.',
      );
    });

    // ── err-06: the unrelated 3-photo guard blocks a pricing-only edit ──
    await capture.step('err-06', 'Attempt to save a pricing-only edit on a product with 1 photo', saveButton(page), async (el) => {
      await page.reload();
      await expect(page.locator('#order-quantity')).toBeVisible({ timeout: 30_000 });
      await bringIntoView(page.locator('#order-quantity'));
      await page.locator('#max-order-input').fill('5000');
      let patched = false;
      const watch = (r: import('@playwright/test').Request) => {
        if (r.method() === 'PATCH' && r.url().includes('/admin/products/')) patched = true;
      };
      page.on('request', watch);
      await el.click();
      // save() guards on image_keys.length < 3 before building any request.
      await expect(page.getByText('At least 3 photos are required')).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1000);
      page.off('request', watch);
      expect(patched, 'a PATCH escaped the photo guard').toBe(false);
    });
  });
});
});
