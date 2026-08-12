// Hand-authored (Module 2 fallback) — see product-catalog.happy.spec.ts's header for why.
//
// WHY THIS IS ONE TEST AND NOT ONE PER ERROR PATH: `POST /admin/auth/login` is rate-limited to
// **10 per hour per IP** (`@limiter.limit("10/hour")`,
// urgent-printers-backend/app/api/v1/routes/admin/auth.py:70). Playwright gives every test its
// own browser context, so one-test-per-scenario means one login per scenario, and this suite
// alone exceeds the hourly quota — every later test then dies at the login step with a 30s
// navigation timeout that reads exactly like an app bug.
//
// Replaying a captured storageState was tried first and does not work here: the refresh cookie
// (`admin_refresh_token`, HttpOnly, Path=/api/v1/admin/auth) is **rotated on every refresh**, so
// a state captured once and replayed into later contexts presents an already-spent token, the
// refresh 401s, `client.ts` logs out, and the page lands on /login. Observed exactly that: every
// restore-path test recorded `route=/login` with a 401 in console, while every real-login test
// passed.
//
// So: all error paths run as one test on one login, in dependency order, with cleanup between.
// The trade-off is real and worth stating — a failure aborts the paths after it, so read a short
// run log as "stopped early", not "the rest passed".
import { test, expect } from '../capture.js';
import {
  login,
  FIXTURES,
  nameField,
  slugField,
  shortDescField,
  categorySelect,
  imageInput,
  videoInput,
  fillCreatableProduct,
  archiveProductByName,
  archiveNamelessProducts,
} from './product-catalog.helpers';

test.use({
  captureOptions: {
    feature: 'Product Catalog Admin Errors',
    plan: 'qa-pipeline/artifacts/plans/product-catalog-admin-to-storefront-plan.json',
    axe: 'per-navigation',
    lighthouse: 'off',
  },
});

test.describe('Product Catalog (Admin) — error paths', () => {
  test('Every validation guard, error message and failure state the product form can show', async ({ page, capture }) => {
    test.setTimeout(900_000);
    const stamp = Date.now();
    const dupTarget = `QA Dup Target ${stamp}`;
    const dupTargetSlug = dupTarget.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await login(page, capture);

    try {
      // ── err-01: the 3-photo guard ──────────────────────────────────────────────────────
      // The photo and pricing-tier guards live in save(), which only runs once the Zod schema
      // passes — so the text fields have to be valid first, otherwise the inline required-field
      // errors fire instead and neither guard is ever reached.
      await capture.step('err-01', 'Publish with every text field filled but no photos uploaded', null, async () => {
        await page.goto('/products/new');
        await expect(page.getByText('3 more photos required — minimum 3.')).toBeVisible({ timeout: 30_000 });
        await nameField(page).fill(`QA Guard Probe ${stamp}`);
        await shortDescField(page).fill('Exercising the photo-minimum guard.');
        const category = categorySelect(page);
        await expect(category.locator('option')).not.toHaveCount(1, { timeout: 20_000 });
        await category.selectOption({ label: 'Business Cards' });

        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('At least 3 photos are required')).toBeVisible({ timeout: 15_000 });
        // The guard sits before saveMutation, so nothing should have navigated away.
        expect(new URL(page.url()).pathname).toBe('/products/new');
      });

      // ── err-02: the pricing-tier guard ─────────────────────────────────────────────────
      await capture.step('err-02', 'Remove every pricing tier, then publish', imageInput(page), async (el) => {
        await el.setInputFiles([FIXTURES.front, FIXTURES.angle, FIXTURES.detail]);
        await expect(page.getByText('Minimum of 3 photos met (3/8).')).toBeVisible({ timeout: 90_000 });

        const tierRows = page.locator('table:has-text("Best Value") tbody tr');
        await expect(tierRows).toHaveCount(5);
        for (let i = 0; i < 5; i += 1) {
          await tierRows.first().locator('td').last().locator('button').click();
        }
        await expect(page.getByText('No pricing tiers yet.')).toBeVisible();

        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('At least one pricing tier is required')).toBeVisible({ timeout: 15_000 });
      });

      // ── err-11: the turnaround guard is unreachable by construction ────────────────────
      await capture.step('err-11', 'Confirm the turnaround-options guard is unreachable from the UI', null, async () => {
        // TurnaroundSection renders a fixed Standard/Express/Rush trio with no add/remove
        // control, so save()'s 'At least one turnaround option is required' toast can never
        // fire. Assert the structural fact the plan claims rather than the toast.
        await expect(page.locator('input[name^="turnaround_options."][name$=".days"]')).toHaveCount(3);
        await expect(
          page.getByText('Standard is always available. Toggle Express / Rush on if you offer them for this product.'),
        ).toBeVisible();
      });

      await capture.step('clean-01', 'Cancel out, cleaning up the uploaded media', page.getByRole('button', { name: 'Cancel' }), async (el) => {
        await el.click();
        await page.waitForURL('**/products');
      });

      // ── err-03/04/05: required-field validation ────────────────────────────────────────
      await capture.step('err-03', 'Publish with Name, Short Description and Category all empty', null, async () => {
        await page.goto('/products/new');
        await imageInput(page).setInputFiles([FIXTURES.front, FIXTURES.angle, FIXTURES.detail]);
        await expect(page.getByText('Minimum of 3 photos met (3/8).')).toBeVisible({ timeout: 90_000 });

        await page.getByRole('button', { name: 'Publish Product' }).click();

        // The form ships Zod messages for all three fields (ProductForm/index.tsx's schema) and
        // BasicInfoSection renders formState.errors under each input — this asserts the
        // validation the code says exists actually reaches the user. Before the fix this click
        // published a product with an empty name, empty slug and no category.
        await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Short description is required')).toBeVisible();
        await expect(page.getByText('Category is required')).toBeVisible();
        expect(new URL(page.url()).pathname).toBe('/products/new');
      });

      await capture.step('clean-02', 'Cancel out again', page.getByRole('button', { name: 'Cancel' }), async (el) => {
        await el.click();
        await page.waitForURL('**/products');
      });

      // ── err-07: oversized video, client-side ───────────────────────────────────────────
      await capture.step('err-07', 'Attach a 151 MB video to the video dropzone', null, async () => {
        await page.goto('/products/new');
        await expect(page.getByText(/Max 150 MB/)).toBeVisible({ timeout: 30_000 });
        await videoInput(page).setInputFiles(FIXTURES.oversizedVideo);
        await expect(page.getByText('Video is too large (151 MB). Maximum is 150 MB.')).toBeVisible({
          timeout: 30_000,
        });
      });

      // ── err-08: low-resolution advisory ────────────────────────────────────────────────
      await capture.step('err-08', 'Upload a 640x420 photo (short side under 800px)', imageInput(page), async (el) => {
        await el.setInputFiles(FIXTURES.lowres);
        await expect(page.getByText('2 more photos required — minimum 3.')).toBeVisible({ timeout: 90_000 });
        const badge = page.locator('span[title^="Low resolution"]');
        await expect(badge).toHaveCount(1);
        await expect(badge).toHaveAttribute(
          'title',
          'Low resolution (640×420px) — aim for at least 800px on the short side.',
        );
      });

      // ── err-09: the backend's 10 MB image cap ──────────────────────────────────────────
      await capture.step('err-09', 'Upload a 12.7 MB photo, over the backend 10 MB cap', imageInput(page), async (el) => {
        await el.setInputFiles(FIXTURES.oversized);
        await expect(page.getByText('Image exceeds 10 MB limit')).toBeVisible({ timeout: 180_000 });
      });

      await capture.step('clean-03', 'Cancel out, cleaning up the uploaded media', page.getByRole('button', { name: 'Cancel' }), async (el) => {
        await el.click();
        await page.waitForURL('**/products');
      });

      // ── err-06: duplicate slug ─────────────────────────────────────────────────────────
      await capture.step('setup-01', 'Create the product whose slug will be collided with', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: dupTarget,
          shortDescription: 'Collision target created by the QA pipeline.',
          category: 'Business Cards',
        });
        await page.getByRole('button', { name: 'Publish Product' }).click();
        await expect(page.getByText('Product created')).toBeVisible({ timeout: 30_000 });
        await page.waitForURL('**/products');
      });

      await capture.step('err-06', 'Publish a second product reusing that slug', null, async () => {
        await page.goto('/products/new');
        await fillCreatableProduct(page, {
          name: `QA Dup Source ${stamp}`,
          shortDescription: 'Second product deliberately reusing an existing slug.',
          category: 'Business Cards',
        });
        // The slug effect only fires when `name` changes, so overwriting it afterwards sticks.
        await slugField(page).fill(dupTargetSlug);
        await page.getByRole('button', { name: 'Publish Product' }).click();

        // Backend answers 409 with "Slug '<slug>' is already in use" — the admin needs to be
        // told which field is wrong and why, not just that something failed.
        await expect(page.getByText(/already in use/i)).toBeVisible({ timeout: 30_000 });
      });

      // ── err-10: unknown product id ─────────────────────────────────────────────────────
      await capture.step('err-10', 'Open /products/99999999', null, async () => {
        await page.goto('/products/99999999');
        // useProductDetail retries three times with backoff before settling, so the first
        // ~10s are a PageSkeleton — wait that out before judging what the page becomes.
        await page.waitForTimeout(25_000);
        // ProductEditClient only branches on isLoading, so a failed fetch renders
        // <ProductForm product={undefined}> — the create-mode form, complete with a
        // 'Publish Product' button, under an 'Edit Product' heading and with every field blank.
        await expect(page.getByRole('button', { name: 'Publish Product' })).toHaveCount(0);
        await expect(nameField(page)).toHaveCount(0);
      });
    } finally {
      await archiveProductByName(page, dupTarget).catch(() => {});
      await archiveProductByName(page, `QA Dup Source ${stamp}`).catch(() => {});
      // Until the required-field guard exists, publishing the empty form really does create a
      // nameless, slugless, uncategorised product live in the catalogue — never leave one behind.
      await archiveNamelessProducts(page).catch(() => {});
    }
  });
});
