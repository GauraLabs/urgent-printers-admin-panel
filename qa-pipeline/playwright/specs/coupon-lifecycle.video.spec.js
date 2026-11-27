import { test, expect } from '../capture.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const DEV_API = 'http://localhost:8020/api/v1';
const SHOP = 'http://localhost:3000';
const ADMIN = 'http://localhost:3001';
const sessionPath = join(homedir(), '.config/urgentprinters-tutorials/coupon-lifecycle-session.json');

// Native 4K plates at a readable CSS viewport; zooms retain detail in both exports.
test.use({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 4,
  captureOptions: { feature: 'Coupon Lifecycle', axe: 'off', lighthouse: 'off', preActionScreenshots: true } });

test('coupon lifecycle — admin, storefront, redemption and deactivation', async ({ page, capture }) => {
  test.setTimeout(600_000);
  const demo = JSON.parse(readFileSync(sessionPath, 'utf8'));
  await page.context().route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return route.abort('blockedbyclient');
    url.hostname = 'localhost'; url.port = '8020';
    return route.continue({ url: url.href });
  });
  await page.addInitScript(() => {
    const inject = () => {
      if (!document.head || document.getElementById('tutorial-style')) return;
      const s = document.createElement('style');s.id='tutorial-style';
      s.textContent='nextjs-portal,[data-sonner-toaster]{display:none!important} main{padding-bottom:180px!important}';document.head.append(s);
    };
    new MutationObserver(inject).observe(document, {childList:true,subtree:true});inject();
  });
  await page.goto(`${ADMIN}/login`);
  await page.locator('#email').fill(process.env.QA_ADMIN_EMAIL ?? 'admin@urgentprinters.com');
  await page.locator('#password').fill(process.env.QA_ADMIN_PASSWORD ?? (() => { throw new Error("Set QA_ADMIN_PASSWORD before recording tutorials"); })());
  const loginResponse = page.waitForResponse(r => r.url().includes('/admin/auth/login') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const login = await loginResponse;
  const loginBody = await login.json();
  const token = (loginBody.data ?? loginBody).access_token;

  const headers = { Authorization: `Bearer ${token}` };
  await page.waitForURL('**/dashboard');
  try {
  // Keep development tooling and transient notifications out of the footage.
  await page.addStyleTag({ content: 'nextjs-portal, [data-sonner-toaster] { display:none!important } main form { padding-bottom:350px }' });
  const listResponse = await page.request.get(`${DEV_API}/admin/coupons?search=PRINT10-DEMO`, { headers });
  expect(listResponse.ok()).toBeTruthy();
  const body = await listResponse.json();
  const prior = Array.isArray(body.data) ? body.data : (body.data ?? body).items;
  const edition = 1 + Math.max(0, ...prior.map(c => Number(/^PRINT10-DEMO-(\d+)$/.exec(c.code)?.[1] ?? 0)));
  const CODE = `PRINT10-DEMO-${String(edition).padStart(2, '0')}`;
  demo.code = CODE;writeFileSync(sessionPath, JSON.stringify(demo, null, 2));
  await page.getByRole('link', { name: 'Coupons', exact: true }).click();
  await expect(page.getByRole('link', { name: 'New Coupon' })).toBeVisible();
  await page.getByPlaceholder(/Search coupon/).fill(CODE);
  await expect(page.getByText(CODE, { exact: true })).toHaveCount(0);
  await capture.step('cp-01', 'Open Coupons from the sidebar', null, async () => {});
  await capture.step('cp-02', 'Choose New Coupon', page.getByRole('link', { name: 'New Coupon' }), async el => {
    await el.click(); await expect(page.getByPlaceholder('SAVE10')).toBeVisible();
  });
  const type = async (id, name, field, value) => {
    await field.scrollIntoViewIfNeeded();
    await capture.type(id, name, field, value);
  };
  await type('cp-03', 'Enter the customer-facing coupon code', page.getByLabel('Coupon Code *'), CODE);
  await type('cp-04', 'Add a clear description', page.getByLabel('Description', { exact: true }), '10% off printing orders');
  await capture.step('cp-05', 'Compare percentage and fixed-amount discount types', page.getByRole('combobox', { name: 'Type *' }), async el => {
    await el.click(); await expect(page.getByRole('option', { name: 'Fixed Amount (₹)' })).toBeVisible();
  });
  await page.getByRole('option', { name: 'Percentage (%)' }).click();
  await type('cp-06', 'Set the percentage discount', page.getByLabel('Value * (%)', { exact: true }), '10');
  await type('cp-07', 'Cap the discount at 200 rupees', page.getByLabel('Max Discount (₹)'), '200');
  await type('cp-08', 'Require a minimum eligible order value of 1000 rupees', page.getByLabel('Minimum Order (₹)'), '1000');
  await type('cp-09', 'Limit this coupon to 100 total redemptions', page.getByLabel('Total Usage Limit'), '100');
  await type('cp-10', 'Allow one redemption per customer', page.getByLabel('Per User Limit'), '1');
  const discounted = page.locator('label').filter({ hasText: 'Applies to items already on discount' }).getByRole('switch');
  await discounted.scrollIntoViewIfNeeded();
  await capture.step('cp-11', 'Exclude items that are already discounted', discounted, async el => {
    await el.click(); await expect(el).not.toBeChecked();
  });
  const specific = page.getByRole('radio', { name: 'Specific products or categories' });
  await specific.scrollIntoViewIfNeeded();
  await capture.step('cp-12', 'Show how product and category restrictions work', specific, async el => {
    await el.check(); await expect(page.locator('#scope-category-search')).toBeVisible();
  });
  await page.getByRole('radio', { name: 'All products', exact: true }).check();
  await capture.step('cp-13', 'Use all products for this example', page.getByTestId('scope-summary'), async el => {
    await expect(el).toHaveText('Applies to all products');
  });
  const date = page.getByLabel('Valid From *');
  await date.scrollIntoViewIfNeeded();
  await capture.step('cp-14', 'Review start date and optional expiry', date, async el => {
    await expect(el).not.toHaveValue('');
    await expect(page.getByLabel('Valid Until', { exact: true })).toHaveValue('');
  });
  const manual = page.getByRole('button', { name: /Manual only/ });
  await manual.scrollIntoViewIfNeeded();
  await capture.step('cp-15', 'Keep manual checkout entry and a public coupon', manual, async el => {
    await el.click();
    await expect(page.locator('label').filter({ hasText: 'Personal coupon' }).getByRole('switch')).not.toBeChecked();
  });
  const active = page.locator('label').filter({ hasText: 'Active (coupon is usable)' }).getByRole('switch');
  await active.scrollIntoViewIfNeeded();
  await capture.step('cp-16', 'Keep the demonstration coupon inactive', active, async el => {
    await el.click(); await expect(el).not.toBeChecked();
  });
  await capture.step('cp-17', 'Create the coupon and verify the saved row', page.getByRole('button', { name: 'Create Coupon', exact: true }), async el => {
    const responsePromise = page.waitForResponse(r => r.url().includes('/admin/coupons') && r.request().method() === 'POST');
    await el.click(); const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    demo.coupon_id = (await response.json()).data.id;
    writeFileSync(sessionPath, JSON.stringify(demo, null, 2));
    await page.waitForURL('**/coupons');
    await page.getByPlaceholder(/Search coupon/).fill(CODE);
    const row = page.getByRole('row').filter({ hasText: CODE });
    await expect(row).toBeVisible(); await expect(row.getByText('Inactive', { exact: true })).toBeVisible();
    await expect(row).toContainText('10%(max ₹200)');
  });
  await capture.step('cp-18', 'Confirm discount, conditions and inactive status in the list', null, async () => {
    await expect(page.getByRole('row').filter({ hasText: CODE })).toContainText('₹1,000');
  });
  const couponId = demo.coupon_id;
  const activeSwitch = () => page.locator('label').filter({ hasText: 'Active (coupon is usable)' }).getByRole('switch');
  await capture.step('lc-01', 'Open the saved coupon for activation', null, async () => {
    await page.goto(`${ADMIN}/coupons/${couponId}`);
    await expect(page.getByLabel('Coupon Code *')).toHaveValue(CODE);
  });
  await capture.step('lc-02', 'Activate the coupon', activeSwitch(), async el => {
    await el.click(); await expect(el).toBeChecked();
  });
  await capture.step('lc-03', 'Save the active coupon', page.getByRole('button', { name: 'Save Changes', exact: true }), async el => {
    await el.click(); await page.waitForURL('**/coupons');
    await page.getByPlaceholder(/Search coupon/).fill(CODE);
    await expect(page.getByRole('row').filter({ hasText: CODE })).toContainText('Active');
  });

  // A genuine dedicated customer session; no authentication or pricing responses are mocked.
  await page.goto(`${SHOP}/auth/login`);
  await page.getByRole('button', { name: 'Email', exact: true }).click();
  await page.locator('#email-address').fill(demo.email);
  await page.locator('#password').fill(demo.password);
  const customerLoginResponse = page.waitForResponse(r => r.url().includes('/auth/login') && !r.url().includes('/admin/') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  const customerLogin = await customerLoginResponse;
  expect(customerLogin.ok()).toBeTruthy();
  const customerToken = (await customerLogin.json()).data.token;
  expect(customerToken).toBeTruthy();
  await page.waitForURL('**/account', { timeout: 30_000 });
  const acceptCookies = page.getByRole('button', { name: 'Accept', exact: true });
  if (await acceptCookies.count()) await acceptCookies.click();
  const productUrl = `${SHOP}/products/stickers-labels/custom-diecut-stickers`;
  const qty = () => page.getByLabel('Quantity', { exact: true }).first();
  const add = () => page.locator('button.w-full.h-12').filter({ hasText: /Add to Cart|Update Cart/ });
  const cartSummary = () => page.getByRole('heading', { name: 'Order Summary', exact: true }).locator('xpath=../..');
  const couponInput = () => page.getByPlaceholder('Coupon code');
  const apply = () => page.getByRole('button', { name: 'Apply', exact: true });
  const applied = () => page.getByText(`${CODE} applied`, { exact: true });
  const discountRow = scope => scope.locator('div.flex.justify-between').filter({ hasText: 'Coupon' }).first();

  await capture.step('sf-01', 'Open the product on the storefront', null, async () => {
    await page.goto(productUrl); await expect(qty()).toHaveValue('50', { timeout: 30_000 });
    await expect(page.getByRole('link', { name: 'My account', exact: true })).toBeVisible({ timeout: 30_000 });
  });
  await capture.step('sf-02', 'Add the 50-piece configuration', add(), async el => {
    await el.click(); await expect(add()).toContainText('Update Cart', { timeout: 20_000 });
  });
  await capture.step('sf-03', 'Open the cart and read the 300-rupee subtotal', null, async () => {
    await page.goto(`${SHOP}/cart`); await expect(cartSummary()).toContainText('₹300.00', { timeout: 30_000 });
  });
  await capture.type('sf-04', 'Enter the same coupon code created in admin', couponInput(), CODE);
  await capture.step('sf-05', 'Demonstrate minimum-order validation', apply(), async el => {
    await el.click(); await expect(page.locator('p.text-destructive')).toContainText(/Minimum order|Add.*700.*more/, { timeout: 20_000 });
  });
  await capture.type('sf-06', 'Increase to 1000 pieces to meet the minimum and demonstrate the cap', qty(), '1000');
  await expect(cartSummary()).toContainText('₹2,500.00', { timeout: 30_000 });
  await capture.step('sf-07', 'Apply the coupon to the eligible cart', apply(), async el => {
    await el.click(); await expect(applied()).toBeVisible({ timeout: 20_000 });
    await expect(discountRow(cartSummary())).toContainText('200.00');
    await expect(cartSummary()).toContainText('₹2,300.00');
  });
  await capture.step('sf-08', 'Explain the 200-rupee cap and discounted total', cartSummary(), async el => {
    await expect(el).toContainText('₹2,500.00'); await expect(el).toContainText('₹2,300.00');
  });
  await capture.step('sf-09', 'Remove the coupon to show the original total', page.getByRole('button', { name: `Remove coupon ${CODE}` }), async el => {
    await el.click(); await expect(couponInput()).toBeVisible();
    await expect(applied()).toHaveCount(0);
  });
  await capture.type('sf-10', 'Re-enter the coupon for checkout', couponInput(), CODE);
  await capture.step('sf-11', 'Reapply and confirm the savings', apply(), async el => {
    await el.click(); await expect(applied()).toBeVisible({ timeout: 20_000 });
    await expect(cartSummary()).toContainText('₹2,300.00');
  });
  await capture.step('sf-12', 'Proceed to checkout with the applied coupon', page.getByRole('link', { name: /Proceed to Checkout/ }), async el => {
    await el.click(); await page.waitForURL('**/checkout');
    await expect(page.getByText('12 Demo Studio, Tutorial Road')).toBeVisible({ timeout: 30_000 });
  });
  await capture.step('sf-13', 'Continue with the saved development delivery address', page.getByRole('button', { name: /Continue to Payment/ }), async el => {
    await el.click(); await expect(page.getByText('Payment Method', { exact: true })).toBeVisible();
  });
  await capture.step('sf-14', 'Choose Cash on Delivery', page.getByRole('button', { name: /Cash on Delivery/ }), async el => {
    await expect(el).toBeEnabled(); await el.click();
  });
  await capture.step('sf-15', 'Request the server-confirmed order review', page.getByRole('button', { name: /Review Order/ }), async el => {
    await el.click(); await expect(page.getByText('Review Your Order')).toBeVisible();
    await expect(page.getByText('Confirming prices…')).toHaveCount(0, { timeout: 30_000 });
  });
  const breakdown = page.locator('div.rounded-2xl').filter({ hasText: 'Price Breakdown' }).first();
  await capture.step('sf-16', 'Verify the coupon in the authoritative checkout breakdown', breakdown, async el => {
    await expect(el).toContainText('₹2,500.00');
    await expect(discountRow(el)).toContainText('200.00');
    await expect(el).toContainText('₹2,300.00');
  });
  await capture.step('sf-17', 'Place the development COD order', page.getByRole('button', { name: /^Place Order/ }), async el => {
    const orderResponse = page.waitForResponse(r => /\/orders\/?$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST');
    await el.click(); const response = await orderResponse;
    expect(response.ok(), 'Server accepted the coupon-backed order').toBeTruthy();
    const order = (await response.json()).data;
    demo.order_id = order.id; demo.order_number = order.orderNumber ?? order.order_number;
    writeFileSync(sessionPath, JSON.stringify(demo, null, 2));
    await page.waitForURL('**/checkout/confirmation/**', { timeout: 60_000 });
  });
  await capture.step('sf-18', 'Verify the discount on the order confirmation', null, async () => {
    await expect(page.getByText(CODE, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Pay ₹2,300.00 in cash')).toBeVisible();
    await expect(page.getByText('−₹200.00').first()).toBeVisible();
  });
  demo.order_id ??= new URL(page.url()).pathname.split('/').pop();
  await capture.step('sf-19', 'Read the same coupon and totals from account order history', null, async () => {
    await page.goto(`${SHOP}/account/orders/${demo.order_id}`);
    await expect(page.getByText(CODE, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('−₹200.00').first()).toBeVisible();
    await expect(page.getByText(/₹2,300(?:\.00)?/).first()).toBeVisible();
  });
  await capture.step('ad-01', 'Verify the coupon snapshot in the admin order', null, async () => {
    await page.goto(`${ADMIN}/orders/${demo.order_id}`);
    await expect(page.getByText(CODE, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/₹2,300(?:\.00)?/).first()).toBeVisible();
  });
  await capture.step('ad-02', 'Inspect coupon usage and discount analytics', null, async () => {
    await page.goto(`${ADMIN}/coupons/${couponId}?tab=analytics`);
    await expect(page.getByText('Total Uses', { exact: true })).toBeVisible({ timeout: 30_000 });
    const result = await page.request.get(`${DEV_API}/admin/coupons/${couponId}/analytics`, { headers });
    expect(result.ok()).toBeTruthy();
    const stats = (await result.json()).data;
    expect(stats.total_uses).toBe(1); expect(Number(stats.total_discount_given)).toBe(200);
    demo.analytics = stats;writeFileSync(sessionPath, JSON.stringify(demo, null, 2));
  });
  await capture.step('sf-20', 'Build a second eligible cart for the same customer', null, async () => {
    await page.goto(productUrl); await expect(qty()).toBeVisible({ timeout: 30_000 });
    await qty().fill('1000'); await expect(add()).toContainText('₹2,500.00', { timeout: 30_000 });
    await add().click(); await expect(add()).toContainText('Update Cart', { timeout: 30_000 });
    await page.goto(`${SHOP}/cart`); await expect(cartSummary()).toContainText('₹2,500.00');
  });
  await capture.type('sf-21', 'Try the same code after one completed redemption', couponInput(), CODE);
  await capture.step('sf-22', 'Show the one-use-per-customer restriction', apply(), async el => {
    await el.click(); await expect(page.locator('p.text-destructive')).toContainText(/already|limit|used/i, { timeout: 20_000 });
  });
  await capture.step('ad-03', 'Return to the admin coupon settings', null, async () => {
    await page.goto(`${ADMIN}/coupons/${couponId}`); await expect(activeSwitch()).toBeChecked({ timeout: 30_000 });
  });
  await capture.step('ad-04', 'Deactivate the offer and save the change', activeSwitch(), async el => {
    await el.click(); await expect(el).not.toBeChecked();
    await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await page.waitForURL('**/coupons');
  });
  await capture.step('sf-23', 'Confirm the inactive code can no longer be applied', null, async () => {
    await page.goto(`${SHOP}/cart`); await expect(couponInput()).toBeVisible({ timeout: 30_000 });
    await couponInput().fill(CODE); await apply().click();
    await expect(page.locator('p.text-destructive')).toContainText(/inactive|Invalid/i, { timeout: 20_000 });
    // Anonymous validation independently proves deactivation is global, not the buyer's usage limit.
    const result = await page.request.post(`${DEV_API}/coupons/validate`, { data: { code: CODE, subtotal: 2500, eligible_subtotal: 2500, items: [{ product_id: 16, total_price: 2500, discounted: false }] } });
    const validation = (await result.json()).data;
    expect(validation.isValid ?? validation.is_valid).toBe(false);
  });
  await capture.step('ad-05', 'Confirm historical orders retain their original coupon discount', null, async () => {
    await page.goto(`${ADMIN}/orders/${demo.order_id}`);
    await expect(page.getByText(CODE, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/₹2,300(?:\.00)?/).first()).toBeVisible();
  });
  await capture.step('ad-06', 'Open cancellation for this development order', page.getByRole('button', { name: 'Cancel', exact: true }), async el => {
    await el.click(); await expect(page.getByRole('button', { name: 'Yes, cancel order' })).toBeVisible();
  });
  await capture.step('ad-07', 'Confirm cancellation without changing the historical discount', page.getByRole('button', { name: 'Yes, cancel order' }), async el => {
    await el.click(); await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(CODE, { exact: false }).first()).toBeVisible();
  });
  await capture.step('ad-08', 'Verify cancellation releases the coupon usage quota', null, async () => {
    await page.goto(`${ADMIN}/coupons`); await page.getByPlaceholder(/Search coupon/).fill(CODE);
    const row = page.getByRole('row').filter({ hasText: CODE });
    await expect(row).toContainText('Inactive'); await expect(row).toContainText('0 / 100');
    const response = await page.request.get(`${DEV_API}/admin/coupons/${couponId}`, { headers });
    const coupon = (await response.json()).data;
    expect(coupon.usage_count).toBe(0); expect(coupon.is_active).toBe(false);
  });
  await capture.step('ad-09', 'Distinguish historical order analytics from available usage quota', null, async () => {
    await page.goto(`${ADMIN}/coupons/${couponId}?tab=analytics`);
    await expect(page.getByText('Total Uses', { exact: true })).toBeVisible();
    const response = await page.request.get(`${DEV_API}/admin/coupons/${couponId}/analytics`, { headers });
    expect((await response.json()).data.total_uses).toBe(1);
  });
  demo.cleanup = { coupon_inactive: true, order_cancelled: true };
  writeFileSync(sessionPath, JSON.stringify(demo, null, 2));
  writeFileSync('qa-pipeline/artifacts/runs/coupon-lifecycle-evidence.json', JSON.stringify({
    coupon_code: CODE, coupon_id: couponId, order_id: demo.order_id, order_number: demo.order_number,
    analytics_at_recording: demo.analytics, cleanup: demo.cleanup, outbound_providers: 'fake', task_broker: 'memory://',
  }, null, 2) + '\n');
  } finally {
    // Development records created by this run only; never touch other coupons or orders.
    if (demo.coupon_id && !demo.cleanup?.coupon_inactive) {
      const result = await page.request.patch(`${DEV_API}/admin/coupons/${demo.coupon_id}`, { headers, data: { is_active: false } });
      if (!result.ok()) console.error('Could not deactivate this run’s demo coupon.');
    }
    if (demo.order_id && !demo.cleanup?.order_cancelled) {
      const result = await page.request.post(`${DEV_API}/admin/orders/${demo.order_id}/cancel`, { headers, data: { reason: 'Development tutorial cleanup; do not fulfil' } });
      if (!result.ok()) console.error('Could not cancel this run’s development order.');
    }
  }

});
