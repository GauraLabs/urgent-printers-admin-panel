// Hand-authored — see pipeline/README.md's "Known infra findings" for why the MCP-driven
// Generator agent isn't in use yet. Grounded in CategoryForm.tsx's Zod schema and
// onSubmit catch block (both read directly, not guessed).
import { test, expect } from '../capture.js';

async function login(page) {
  await page.goto('/login');
  await page.locator('#email').fill('admin@urgentprinters.com');
  await page.locator('#password').fill('SuperAdmin@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

const nameField = (page) => page.locator('label:text-is("Name *")').locator('xpath=following-sibling::input[1]');
const slugField = (page) => page.locator('label:text-is("Slug *")').locator('xpath=following-sibling::input[1]');
const IMAGE_FIXTURE = 'node_modules/@remotion/studio-server/web/coding-agent-icons/claude-code.png';

test.describe('Category Management — err-01 zero images', () => {
  test.use({
    captureOptions: {
      feature: 'Category Management Err01 Zero Images',
      plan: 'qa-pipeline/artifacts/plans/category-management-plan.json',
      axe: 'off',
      lighthouse: 'off',
    },
  });

  test('submitting with zero images shows a validation error and does not save', async ({ page, capture }) => {
    await capture.step('auth-01', 'Log in as the seeded super admin', null, () => login(page));
    await capture.step('set-01', 'Open the new-category form and fill only the name', null, async () => {
      await page.goto('/categories/new');
      await nameField(page).fill(`QA Err01 No Image ${Date.now()}`);
    });
    await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
    await capture.step(
      'err-01',
      'Submit with zero images uploaded',
      page.getByRole('button', { name: 'Create Category' }),
      async (el) => {
        await el.click();
        await expect(page.getByText('At least 1 photo is required')).toBeVisible({ timeout: 5_000 });
        await expect(page).toHaveURL(/\/categories\/new$/);
        await expect(page.getByText('Category created')).toHaveCount(0);
      },
    );
  });
});

test.describe('Category Management — err-02 empty name', () => {
  test.use({
    captureOptions: {
      feature: 'Category Management Err02 Empty Name',
      plan: 'qa-pipeline/artifacts/plans/category-management-plan.json',
      axe: 'off',
      lighthouse: 'off',
    },
  });

  test('submitting with an empty name shows a validation error and does not save', async ({ page, capture }) => {
    await capture.step('auth-01', 'Log in as the seeded super admin', null, () => login(page));
    await capture.step('set-02', 'Open the new-category form and upload an image, leaving Name blank', null, async () => {
      await page.goto('/categories/new');
      const imageInput = page.locator('input[type="file"][accept*="image"]');
      await imageInput.setInputFiles(IMAGE_FIXTURE);
      await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({ timeout: 20_000 });
    });
    await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
    await capture.step(
      'err-02',
      'Submit with an empty Name field',
      page.getByRole('button', { name: 'Create Category' }),
      async (el) => {
        await el.click();
        await expect(page.getByText('Name is required')).toBeVisible({ timeout: 5_000 });
        await expect(page).toHaveURL(/\/categories\/new$/);
        await expect(page.getByText('Category created')).toHaveCount(0);
      },
    );
  });
});

test.describe('Category Management — err-03 duplicate slug', () => {
  test.use({
    captureOptions: {
      feature: 'Category Management Err03 Duplicate Slug',
      plan: 'qa-pipeline/artifacts/plans/category-management-plan.json',
      axe: 'off',
      lighthouse: 'off',
    },
  });

  test('submitting a slug that collides with an existing category shows an error, not a silent success', async ({ page, capture }) => {
    await capture.step('auth-01', 'Log in as the seeded super admin', null, () => login(page));
    await capture.step(
      'set-03',
      'Open the new-category form, name it so the slug collides with an existing category, and upload an image',
      null,
      async () => {
        await page.goto('/categories/new');
        // "Business Cards" auto-slugifies to "business-cards", which already exists — see the
        // plan's err-03 for why this is a real, undertested path (the app's catch block shows
        // the same generic "Failed to save category" for this as for any other failure type).
        await nameField(page).fill('Business Cards');
        const imageInput = page.locator('input[type="file"][accept*="image"]');
        await imageInput.setInputFiles(IMAGE_FIXTURE);
        await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({ timeout: 20_000 });
      },
    );
    await page.getByRole('button', { name: 'Create Category' }).scrollIntoViewIfNeeded();
    await capture.step(
      'err-03',
      'Submit with a name that slugifies to an existing slug',
      page.getByRole('button', { name: 'Create Category' }),
      async (el) => {
        await expect(slugField(page)).toHaveValue('business-cards');
        await el.click();
        await expect(page.getByText('Failed to save category')).toBeVisible({ timeout: 10_000 });
        await expect(page).toHaveURL(/\/categories\/new$/);
      },
    );
    await capture.step('chk-03', 'Confirm no duplicate category was created', null, async () => {
      await page.goto('/categories');
      await expect(page.locator('tr', { hasText: 'Business Cards' })).toHaveCount(1);
    });
  });
});
