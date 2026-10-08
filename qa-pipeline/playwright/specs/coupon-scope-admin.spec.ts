// Hand-authored (pipeline/README.md "The hand-authoring fallback"). The admin half of the
// "Checkout pricing and coupons" run: creating the scoped coupons the storefront half then
// applies, through the new "Applies to" picker rather than through the API, so the picker
// itself is exercised.
//
// One login for all four coupons on purpose: POST /admin/auth/login is 10/hour/IP and a
// Playwright context-per-test would spend one each.
import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../capture.js';

const PLAN = '../urgent-printers-frontend/qa-pipeline/artifacts/plans/checkout-pricing-coupons-plan.json';

const ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL ?? 'admin@urgentprinters.com';
const ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD ?? 'SuperAdmin@123';

test.use({
  captureOptions: {
    feature: 'Coupon Scope Admin Setup',
    plan: PLAN,
    axe: 'per-navigation',
    // Structurally unreliable on the admin panel: the access token is in memory only, so a
    // post-login audit is redirected to /login (pipeline/README.md, known per-app wrinkles).
    lighthouse: 'off',
  },
});

const codeField = (page: Page): Locator => page.getByPlaceholder('SAVE10');
const descField = (page: Page): Locator => page.getByPlaceholder('10% off all orders');
// EXACT match matters: the code field's placeholder is "SAVE10", which *contains* "10", so a
// substring match on '10' resolves to the code input and silently overwrites the coupon code
// (it did, on the first run of this spec — a coupon literally called "10" was created).
const valueField = (page: Page): Locator => page.getByPlaceholder('10', { exact: true });
const productSearch = (page: Page): Locator => page.locator('#scope-product-search');
const categorySearch = (page: Page): Locator => page.locator('#scope-category-search');
const scopeSummary = (page: Page): Locator => page.getByTestId('scope-summary');
const specificRadio = (page: Page): Locator =>
  page.getByRole('radio', { name: 'Specific products or categories' });

/** Pick a product from the picker's live search results. */
async function pickProduct(page: Page, name: string): Promise<void> {
  await productSearch(page).fill(name.slice(0, 12));
  const results = page.getByTestId('scope-product-results');
  await expect(results).toBeVisible({ timeout: 20_000 });
  await results.getByRole('button', { name }).first().click();
  await expect(page.getByRole('button', { name: `Remove ${name}` })).toBeVisible({ timeout: 10_000 });
}

async function pickCategory(page: Page, name: string): Promise<void> {
  await categorySearch(page).fill(name.slice(0, 6));
  const results = page.getByTestId('scope-category-results');
  await expect(results).toBeVisible({ timeout: 20_000 });
  await results.getByRole('button', { name }).first().click();
  await expect(page.getByRole('button', { name: `Remove ${name}` })).toBeVisible({ timeout: 10_000 });
}

/** Open a blank coupon form and fill the always-required fields. */
async function startCoupon(page: Page, code: string, description: string, percent: string): Promise<void> {
  await page.goto('/coupons/new');
  await expect(codeField(page)).toBeVisible({ timeout: 30_000 });
  await codeField(page).fill(code);
  await descField(page).fill(description);
  await valueField(page).fill(percent);
  await specificRadio(page).check();
}

async function saveCoupon(page: Page, code: string): Promise<void> {
  await page.getByRole('button', { name: 'Create Coupon' }).click();
  await page.waitForURL('**/coupons', { timeout: 30_000 });
  await expect(page.getByText(code, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
}

test.describe('Coupon scope (admin) — create the scoped coupons through the Applies-to picker', () => {
  test.describe.configure({ timeout: 600_000 });

  test('product, category, product+category and exclude-discounted scopes', async ({ page, capture }) => {
    // ── auth (infrastructure, not a plan step) ──
    await capture.step('auth-01', 'Open the admin login page', null, () => page.goto('/login'));
    await capture.type('auth-02', 'Enter the admin email', page.locator('#email'), ADMIN_EMAIL);
    await capture.type('auth-03', 'Enter the admin password', page.locator('#password'), ADMIN_PASSWORD);
    await capture.step('auth-04', 'Submit the login form', page.getByRole('button', { name: 'Sign in' }), async (el: Locator) => {
      await el.click();
      await page.waitForURL('**/dashboard', { timeout: 30_000 });
    });

    // ── adm-01: the picker defaults to "All products" and says so ──
    await page.goto('/coupons/new');
    await expect(codeField(page)).toBeVisible({ timeout: 30_000 });
    // capture.js measures the bounding box before the step runs, and validate.mjs rejects a box
    // that lies outside the 1280x720 capture viewport — the scope summary is below the fold.
    await scopeSummary(page).scrollIntoViewIfNeeded().catch(() => {});
    await capture.step('adm-01', 'Read the new "Applies to" picker in its default state', scopeSummary(page), async (el) => {
      await expect(page.getByRole('radio', { name: 'All products' })).toBeChecked();
      await expect(el).toHaveText('Applies to all products');
      // The product/category inputs only exist once "Specific" is chosen.
      await expect(productSearch(page)).toHaveCount(0);
    });

    // ── adm-02: scope (a) — one product ──
    await capture.step('adm-02', 'Create a 10% coupon scoped to one product (Custom Die-Cut Stickers)', specificRadio(page), async () => {
      await codeField(page).fill('QA-CHECKOUT-SCOPE-PROD');
      await descField(page).fill('QA checkout test: 10% off die-cut stickers only');
      await valueField(page).fill('10');
      await specificRadio(page).check();
      await expect(productSearch(page)).toBeVisible();
      await pickProduct(page, 'Custom Die-Cut Stickers');
      await expect(scopeSummary(page)).toHaveText('Applies to 1 product');
      await saveCoupon(page, 'QA-CHECKOUT-SCOPE-PROD');
    });

    // ── adm-03: scope (b) — one category ──
    await capture.step('adm-03', 'Create a 10% coupon scoped to one category (Business Cards)', null, async () => {
      await startCoupon(page, 'QA-CHECKOUT-SCOPE-CAT', 'QA checkout test: 10% off business cards', '10');
      await pickCategory(page, 'Business Cards');
      await expect(scopeSummary(page)).toHaveText('Applies to 1 category');
      await saveCoupon(page, 'QA-CHECKOUT-SCOPE-CAT');
    });

    // ── adm-04: scope (c) — product AND category, which the backend unions ──
    await capture.step('adm-04', 'Create a 10% coupon scoped to a product AND a category', null, async () => {
      await startCoupon(page, 'QA-CHECKOUT-SCOPE-UNION', 'QA checkout test: 10% off stickers and flyers', '10');
      await pickProduct(page, 'Custom Die-Cut Stickers');
      await pickCategory(page, 'Flyers & Leaflets');
      await expect(scopeSummary(page)).toHaveText('Applies to 1 product and 1 category');
      await saveCoupon(page, 'QA-CHECKOUT-SCOPE-UNION');
    });

    // ── adm-05: scope (d) — scoped AND excluding items already on discount ──
    await capture.step('adm-05', 'Create a 20% coupon scoped to Business Cards that also excludes items already on discount', null, async () => {
      await startCoupon(page, 'QA-CHECKOUT-SCOPE-NODISC', 'QA checkout test: 20% off full-price business cards', '20');
      await pickCategory(page, 'Business Cards');
      // Turning the switch off is what makes scope and sale-state intersect. The Base UI Switch
      // is wrapped in its own <label>, so clicking the label text toggles it.
      // Scoped to the switch's own <label>: the ScopePicker's help paragraph quotes the same
      // phrase, so a bare getByText is ambiguous (it was, on the first run).
      await page.locator('label').filter({ hasText: 'Applies to items already on discount' }).getByRole('switch').click();
      await expect(page.getByText('Items sold below their MRP are excluded; the minimum order and the discount are calculated on the remaining items only')).toBeVisible({ timeout: 10_000 });
      await expect(scopeSummary(page)).toHaveText('Applies to 1 category');
      await saveCoupon(page, 'QA-CHECKOUT-SCOPE-NODISC');
    });

    // ── adm-06: the list shows what each coupon is scoped to ──
    await capture.step('adm-06', 'Read the four new coupons back from the coupons list', null, async () => {
      await page.goto('/coupons?search=QA-CHECKOUT-SCOPE');
      for (const code of ['QA-CHECKOUT-SCOPE-PROD', 'QA-CHECKOUT-SCOPE-CAT', 'QA-CHECKOUT-SCOPE-UNION', 'QA-CHECKOUT-SCOPE-NODISC']) {
        await expect(page.getByText(code).first()).toBeVisible({ timeout: 30_000 });
      }
    });
  });
});
