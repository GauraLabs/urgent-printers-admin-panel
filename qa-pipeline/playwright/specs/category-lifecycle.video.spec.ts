// Produces the source material for the ONE combined admin->storefront demo video (see
// pipeline/README.md and this feature's shot list). Deliberately separate from
// category-management.happy.spec.ts (which validates create/reorder/edit/delete and cleans
// up after itself) — this run creates realistic, on-brand content and leaves it in place so
// the storefront half of the video can pick it up. Not a throwaway QA fixture: "Wedding
// Invitations" is a plausible real category for a printing business, not test noise.
import { test, expect } from '../capture.js';

test.use({
  captureOptions: {
    feature: 'Category Lifecycle Admin',
    plan: 'qa-pipeline/artifacts/plans/category-management-plan.json',
    axe: 'per-navigation',
    lighthouse: 'off',
  },
});

const CATEGORY_NAME = 'Wedding Invitations';
const CATEGORY_NAME_UPDATED = 'Wedding Invitations & Save the Dates';
const DESCRIPTION = 'Premium wedding invitations on luxe cardstock, with foil and letterpress finishes available.';
const IMAGE_FIXTURE = 'node_modules/@remotion/studio-server/web/coding-agent-icons/claude-code.png';

test.describe('Category Lifecycle — admin creates and updates a category', () => {
  test('create Wedding Invitations, then rename it without breaking its URL', async ({ page, capture }) => {
    await capture.step('auth-01', 'Log in as the seeded super admin', null, async () => {
      await page.goto('/login');
      await page.locator('#email').fill('admin@urgentprinters.com');
      await page.locator('#password').fill('SuperAdmin@123');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/dashboard', { timeout: 15_000 });
    });

    await capture.step('hp-01', 'Open the categories list', null, () => page.goto('/categories'));

    await capture.step(
      'hp-02',
      'Click "Add Category"',
      page.getByRole('link', { name: 'Add Category' }),
      async (el) => {
        await el.click();
        await page.waitForURL('**/categories/new');
      },
    );

    const nameField = page.locator('label:text-is("Name *")').locator('xpath=following-sibling::input[1]');
    const slugField = page.locator('label:text-is("Slug *")').locator('xpath=following-sibling::input[1]');
    const descField = page.locator('label:text-is("Description")').locator('xpath=following-sibling::textarea[1]');

    await capture.type('hp-03', 'Enter the category name', nameField, CATEGORY_NAME);
    await capture.step('hp-04', 'Observe the auto-derived Slug', slugField, async (el) => {
      await expect(el).toHaveValue('wedding-invitations');
    });
    await capture.type('hp-05', 'Enter a description', descField, DESCRIPTION);

    await capture.step('hp-06', 'Upload one category image', null, async () => {
      const imageInput = page.locator('input[type="file"][accept*="image"]');
      await imageInput.setInputFiles(IMAGE_FIXTURE);
      await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({ timeout: 20_000 });
    });

    await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
    await capture.step(
      'hp-07',
      'Submit the form',
      page.getByRole('button', { name: 'Create Category' }),
      async (el) => {
        await el.click();
        await expect(page.getByText('Category created')).toBeVisible({ timeout: 10_000 });
        await page.waitForURL('**/categories');
      },
    );

    const row = page.locator('tr', { hasText: CATEGORY_NAME });
    await capture.step('hp-08', 'Locate the new category row', row, async () => {
      await expect(row).toBeVisible();
      await expect(row.getByText('Active')).toBeVisible();
    });

    await capture.step('hp-09', 'Rename the category — the URL slug stays put', row.locator('button').last(), async (el) => {
      await el.click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await page.waitForURL('**/categories/*');

      const editNameField = page.locator('label:text-is("Name *")').locator('xpath=following-sibling::input[1]');
      const editSlugField = page.locator('label:text-is("Slug *")').locator('xpath=following-sibling::input[1]');
      await editNameField.fill('');
      await editNameField.fill(CATEGORY_NAME_UPDATED);
      await expect(editSlugField).toHaveValue('wedding-invitations'); // unchanged on edit, by design

      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText('Category updated')).toBeVisible({ timeout: 10_000 });
      await page.waitForURL('**/categories');
    });

    await capture.step('hp-10', 'Confirm the renamed category is live in the list', page.locator('tr', { hasText: CATEGORY_NAME_UPDATED }), async (el) => {
      await expect(el).toBeVisible();
    });
  });
});
