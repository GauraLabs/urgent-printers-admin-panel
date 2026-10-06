// Hand-authored (Module 2 fallback), not produced by the playwright-test MCP server's
// Generator agent — `.mcp.json` pins the server's cwd to this app via a shell wrapper, and
// pipeline/README.md findings #4-#8 document that path as unreliable here (orphaned
// run-test-mcp-server trees, config re-relativisation) with hand-authoring as the documented
// fallback. Every selector below is grounded in the real source, not a live DOM snapshot:
//   ProductForm/PricingSection.tsx — #pack-size-input, aria-label 'Pack size' / 'Unit label',
//     per-row aria-labels 'Price per pack for pricing tier N', data-testid 'tier-pieces' /
//     'tier-per-piece', and the pack-mode <th> copy 'Packs' / 'Price per pack (₹)'.
//   ProductForm/PrintSpecsSection.tsx — 'Label for finish N', row errors are role="alert".
//   ProductForm/index.tsx — Section('Pricing Tiers *'), 'Save Changes' on an existing product,
//     and the 3-photo guard in save() that blocks any save on a product with no images.
//   features/products/components/FeedUrlCard.tsx — aria-labelledby heading 'Shopping feed'.
// Treat a first-run selector failure as more likely the spec's fault than the app's.
//
// ONE test / ONE login on purpose: POST /admin/auth/login is limited to 10/hour/IP and
// Playwright gives each test its own context (hence its own login).
import { test, expect } from '../capture.js';
import { login, FIXTURES, imageInput } from './product-catalog.helpers';

test.use({
  captureOptions: {
    feature: 'Pack Selling Admin',
    plan: 'qa-pipeline/artifacts/plans/pack-selling-admin-plan.json',
    axe: 'per-navigation',
    lighthouse: 'off', // admin token is in-memory only — a Lighthouse checkpoint lands on /login
  },
});

// Custom Die-Cut Stickers: the sticker-like dev product. Stored tiers are 50/100/250/500/1000
// pcs, every one a multiple of 50, so pack size 50 is accepted without touching a quantity.
const PRODUCT_ID = 16;
const packSizeInput = (page: import('@playwright/test').Page) => page.locator('#pack-size-input');
const unitLabelInput = (page: import('@playwright/test').Page) => page.locator('input[aria-label="Unit label"]');
const packPriceInput = (page: import('@playwright/test').Page, row: number) =>
  page.locator(`input[aria-label="Price per pack for pricing tier ${row}"]`);
const tierRow = (page: import('@playwright/test').Page, row: number) =>
  page.locator('table tbody tr').nth(row - 1);

test.describe('Pack/Set Selling (Admin)', () => {
  test('Configure pack selling on a sticker product, see the feed URL, and hit the pack validations', async ({ page, capture }) => {
    test.setTimeout(300_000);

    await login(page, capture);

    // ── hp-02: the shopping-feed URL card on the products list ──
    await capture.step('hp-02', 'Open the products list and read the Shopping feed card', null, async () => {
      await page.goto('/products');
      const feedCard = page.locator('section[aria-labelledby="feed-url-heading"]');
      await expect(feedCard.getByRole('heading', { name: 'Shopping feed' })).toBeVisible();
      // NEXT_PUBLIC_API_URL already carries the /api/v1 prefix, so the card must show the
      // real route, not a prefix-less one that would 404 for a merchant-centre fetch.
      await expect(feedCard.locator('input[aria-label="Shopping feed URL"]'))
        .toHaveValue('http://localhost:8000/api/v1/feeds/products.xml');
      await expect(feedCard.getByRole('button', { name: 'Copy' })).toBeVisible();
      await expect(feedCard).toContainText('One feed for Google Merchant Center, Microsoft Merchant Center and the Meta catalog.');
      await expect(feedCard).toContainText('Only active, categorised products with at least one image are listed.');
    });

    // ── hp-03: the form hydrates pack mode from the stored per-unit tiers ──
    // Deliberately written to be re-runnable: this product stays pack-configured once saved
    // (the storefront half of this feature needs it to), so the spec asserts the hydration
    // and then drives the 50 -> 1 -> 50 round trip rather than assuming a virgin pack_size=1.
    await capture.step('hp-03', 'Open the sticker product and read the stored pack configuration', null, async () => {
      await page.goto(`/products/${PRODUCT_ID}`);
      await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('Sold in packs of')).toBeVisible();
      await expect(packSizeInput(page)).toHaveValue('50');
      await expect(unitLabelInput(page)).toHaveValue('pcs');
      await expect(page.getByRole('columnheader', { name: 'Packs' })).toBeVisible();
      await expect(page.getByText('Customers buy whole packs.')).toBeVisible();
      // Stored 6.00/unit on the 50-pcs tier hydrates as one pack at ₹300.00.
      await expect(packPriceInput(page, 1)).toHaveValue('300');
      await expect(tierRow(page, 1).locator('[data-testid="tier-per-piece"]')).toHaveText('₹6.00/pc');
    });

    // capture.step measures the bounding box BEFORE acting (so the renderer can animate a
    // cursor toward it), and the pricing section sits below the fold on a fresh load — scroll
    // first or the recorded box lands outside the 1280x720 viewport and fails run validation.
    await packSizeInput(page).scrollIntoViewIfNeeded();

    // ── alt-01: pack size back to 1 restores per-unit entry with no drift ──
    await capture.step('alt-01', 'Set the pack size back to 1 and confirm per-unit entry returns', packSizeInput(page), async (el) => {
      await el.fill('1');
      await el.blur();
      await expect(page.getByRole('columnheader', { name: 'Quantity' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Price / unit (₹)' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Packs' })).toHaveCount(0);
      await expect(page.getByText('Leave at 1 to sell by the piece.')).toBeVisible();
      // The same stored wire tiers, re-expressed per unit: 50 pcs @ ₹6.00, 250 pcs @ ₹6.00.
      await expect(tierRow(page, 1).locator('input[aria-label="Quantity for pricing tier 1"]')).toHaveValue('50');
      await expect(tierRow(page, 1).locator('input[aria-label="Price per unit for pricing tier 1"]')).toHaveValue('6');
      await expect(tierRow(page, 3).locator('input[aria-label="Quantity for pricing tier 3"]')).toHaveValue('250');
    });

    // ── hp-04: switch to pack mode; stored per-unit tiers re-express as packs ──
    await capture.step('hp-04', "Set the pack size to 50 and watch the tier table switch to packs", packSizeInput(page), async (el) => {
      await el.fill('50');
      await el.blur();
      await expect(page.getByRole('columnheader', { name: 'Packs' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Price per pack (₹)' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'MRP per pack (₹)' })).toBeVisible();
      await expect(page.getByText('Customers buy whole packs.')).toBeVisible();

      // Row 1 is the 50-pcs tier at ₹6.00/unit -> 1 pack at ₹300.00.
      await expect(tierRow(page, 1).locator('input[aria-label="Packs for pricing tier 1"]')).toHaveValue('1');
      await expect(packPriceInput(page, 1)).toHaveValue('300');
      await expect(tierRow(page, 1).locator('[data-testid="tier-pieces"]')).toHaveText('= 50 pcs');
      await expect(tierRow(page, 1).locator('[data-testid="tier-per-piece"]')).toHaveText('₹6.00/pc');

      // Row 3 is the 250-pcs tier at ₹6.00/unit -> 5 packs, each priced ₹300.00. Note the
      // input is the price of ONE pack, not the row total (the Total column carries 5 x 300
      // = ₹1,500.00), which is exactly the distinction the pack-mode table exists to make.
      await expect(tierRow(page, 3).locator('input[aria-label="Packs for pricing tier 3"]')).toHaveValue('5');
      await expect(packPriceInput(page, 3)).toHaveValue('300');
      await expect(tierRow(page, 3).locator('[data-testid="tier-pieces"]')).toHaveText('= 250 pcs');
      await expect(tierRow(page, 3).locator('[data-testid="tier-per-piece"]')).toHaveText('₹6.00/pc');
      await expect(tierRow(page, 3)).toContainText('₹1,500');
    });

    await packPriceInput(page, 1).scrollIntoViewIfNeeded();

    // ── hp-05: ₹300 per pack of 50 is exact -> ₹6.00/pc, no field error ──
    await capture.step('hp-05', 'Enter ₹300 as the price for one pack of 50', packPriceInput(page, 1), async (el) => {
      await el.fill('300');
      await el.blur();
      await expect(tierRow(page, 1).locator('[data-testid="tier-per-piece"]')).toHaveText('₹6.00/pc');
      await expect(tierRow(page, 1).locator('[data-testid="tier-pieces"]')).toHaveText('= 50 pcs');
      // 30000 paise / 50 = 600 paise exactly, so nothing may be flagged on this field.
      await expect(packPriceInput(page, 1).locator('xpath=following-sibling::p[1]')).not.toContainText('does not divide');
    });

    // ── setup: ProductForm.save() hard-requires 3 photos and this product shipped with
    // none, so a pack-only edit cannot be saved until it has them. Idempotent: only upload
    // when the minimum is not already met, so a re-run does not pile up images.
    await capture.step('setup-01', 'Make sure the product satisfies the 3-photo save guard', null, async () => {
      const met = page.getByText('Minimum of 3 photos met', { exact: false });
      if ((await met.count()) === 0) {
        await imageInput(page).setInputFiles([FIXTURES.front, FIXTURES.angle, FIXTURES.detail]);
      }
      await expect(met.first()).toBeVisible({ timeout: 90_000 });
    });

    // ── hp-06: save, and confirm the wire stayed per-unit ──
    await capture.step('hp-06', 'Save the product in pack mode', page.getByRole('button', { name: 'Save Changes' }), async (el) => {
      const saved = page.waitForResponse(
        (r) => r.url().includes(`/admin/products/${PRODUCT_ID}`) && r.request().method() === 'PATCH',
        { timeout: 60_000 },
      );
      await el.click();
      const response = await saved;
      expect(response.status()).toBe(200);
      const body = (await response.json()).data;
      expect(body.pack_size).toBe(50);
      expect(body.unit_label).toBe('pcs');
      // The admin form divides client-side; the wire contract stays per-unit (spec D2).
      const edited = body.pricing_tiers.find((t: { quantity: number }) => t.quantity === 50);
      expect(edited.price_per_unit).toBe(6);
      // Quantities are pieces everywhere — pack mode must not rewrite them.
      expect(body.pricing_tiers.map((t: { quantity: number }) => t.quantity).sort((a: number, b: number) => a - b))
        .toEqual([50, 100, 250, 500, 1000]);
    });

    // ── hp-07: the products list prices the pack ──
    await capture.step('hp-07', 'Confirm the products list shows the pack price for this product', null, async () => {
      // Filters live in React state, not the URL — the search box has to be typed into.
      await page.goto('/products');
      await page.getByPlaceholder('Search products…').fill('Die-Cut');
      const row = page.locator('tbody tr', { hasText: 'Custom Die-Cut Stickers' }).first();
      await expect(row).toBeVisible({ timeout: 30_000 });
      // The 'Lowest tier price' column is min(price_per_unit) x pack_size, i.e. the best
      // per-pack RATE (₹2.50/unit on the 1,000-pc tier x 50 = ₹125), not the price of a
      // single pack. The storefront card instead shows the is_best_value tier (₹6.00 x 50 =
      // ₹300), so the two surfaces legitimately differ — a pre-existing min-vs-best-value
      // divergence that pack selling scales rather than introduces. Asserted as-built.
      await expect(row.locator('[data-testid="min-price-pack"]')).toContainText('₹125');
      await expect(row.locator('[data-testid="min-price-pack"]')).toContainText('per pack of 50');
    });

    // ── err-01: a pack price that is not a whole number of paise per piece ──
    // The spec's own illustration (₹100 per pack of 30) is unit-tested in
    // ProductForm/schema.test.ts:349 but is NOT reachable through this form: at pack size 30
    // every stored tier (50/100/250/500/1000 pcs) rehydrates to a fractional `packs`, so the
    // derived `quantity` stops being an integer, fails tierSchema's `.int()` base check, and
    // zod skips the object-level superRefine that owns the paise rule. Exercised here at the
    // reachable equivalent — same `paiseDividesEvenly` code path, integral quantities.
    await capture.step('err-01', 'Enter a pack price that does not divide into whole paise per piece', null, async () => {
      await page.goto(`/products/${PRODUCT_ID}`);
      await expect(packSizeInput(page)).toHaveValue('50', { timeout: 30_000 });
      await packPriceInput(page, 1).fill('300.01');
      await packPriceInput(page, 1).blur();
      // 30001 paise / 50 is not a whole number of paise, so the per-piece readout blanks.
      await expect(tierRow(page, 1).locator('[data-testid="tier-per-piece"]')).toHaveText('');
      // formState.errors is only populated by the zod resolver, which runs on submit.
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(
        page.getByText('₹300.01 per pack does not divide into whole paise per piece at pack size 50'),
      ).toBeVisible({ timeout: 30_000 });
    });

    // ── err-02: a pack size no tier quantity divides by cannot be saved ──
    await capture.step('err-02', 'Confirm a pack size that no tier divides by never reaches the backend', null, async () => {
      await page.goto(`/products/${PRODUCT_ID}`);
      await expect(packSizeInput(page)).toHaveValue('50', { timeout: 30_000 });
      await packSizeInput(page).fill('30');
      await packSizeInput(page).blur();
      let patched = false;
      page.on('request', (r) => {
        if (r.method() === 'PATCH' && r.url().includes('/admin/products/')) patched = true;
      });
      await page.getByRole('button', { name: 'Save Changes' }).click();
      // Validation blocks the submit, so no PATCH is issued at all.
      await expect(page.locator('p.text-\\[var\\(--danger\\)\\], p[role="alert"]').first()).toBeVisible({ timeout: 30_000 });
      expect(patched).toBe(false);
      // And the stored configuration is untouched. (The backend refuses this independently
      // with 422 pack_size_tier_mismatch — verified directly against the admin API, since
      // the client-side guard means the form never gets far enough to show it.)
      const stored = await page.evaluate(async () => {
        const res = await fetch('http://localhost:8000/api/v1/products/custom-diecut-stickers');
        return (await res.json()).data.pack_size;
      });
      expect(stored).toBe(50);
    });

    // ── err-03: duplicate option label flags the right row, in the right group ──
    await capture.step('err-03', 'Give two finishes the same normalised label', null, async () => {
      await page.goto(`/products/${PRODUCT_ID}`);
      await expect(page.getByTestId('option-rename-hint')).toBeVisible({ timeout: 30_000 });
      const finishOne = page.locator('input[aria-label="Label for finish 1"]');
      const finishTwo = page.locator('input[aria-label="Label for finish 2"]');
      await expect(finishOne).toHaveValue('Die-Cut');
      // 'die cut' normalises to 'diecut', the same key as 'Die-Cut'.
      await finishTwo.fill('die cut');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      // DynamicList renders the row error as a role="alert" sibling inside the row wrapper,
      // so this asserts the message landed on the *later duplicate row of the finishes
      // group* specifically, which is what "highlights the right section" means here.
      const rowError = finishTwo.locator('xpath=ancestor::div[3]').locator('p[role="alert"]');
      await expect(rowError).toHaveText(
        'Another option in this group has the same name (case, spaces and punctuation are ignored)',
        { timeout: 30_000 },
      );
      // Only the duplicate row is flagged — not finish 1, and not another option group.
      await expect(page.locator('p[role="alert"]', { hasText: 'Another option in this group' })).toHaveCount(1);
      await expect(
        page.locator('input[aria-label="Label for finish 1"]').locator('xpath=ancestor::div[3]').locator('p[role="alert"]'),
      ).toHaveCount(0);
    });

    // ── alt-03: the deprecated quantity-steps editor is gone ──
    await capture.step('alt-03', 'Confirm the Quantity steps editor has been removed', null, async () => {
      await expect(page.getByText('Quantity steps', { exact: false })).toHaveCount(0);
      await expect(page.locator('input[aria-label^="Quantity step"]')).toHaveCount(0);
    });
  });
});
