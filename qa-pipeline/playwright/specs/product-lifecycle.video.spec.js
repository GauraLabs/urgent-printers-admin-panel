import { test,expect as baseExpect } from '../capture.js';
import { setup,ADMIN,SHOP,API,save,load,folder } from './catalog-tutorial.helpers.js';
import { readFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';
const expect=baseExpect.configure({timeout:30_000});
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,captureOptions:{feature:'Product Lifecycle',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',persistEachStep:true}});
test('product draft, publish, purchase, update and retirement',async({page,capture})=>{
 test.setTimeout(900_000);
 const state=load();if(!state.owned_demo||!state.child_id)throw new Error('Record category-creation first');
 for(const key of ['product_id','product_slug','product_name','order_id','order_number','order_cancelled','product_inactive'])delete state[key];save(state);
 const buyer=JSON.parse(readFileSync(join(folder,'product-lifecycle-session.json')));
 const {headers,step,type}=await setup(page,capture,'product-lifecycle');
 const name=`Foil Wedding Invitations ${Date.now().toString().slice(-6)}`;
 const updated='Elegant foil invitations with premium paper and a carefully finished print.';
 const active=()=>page.getByRole('switch',{name:'Active (visible on site)'});
 const qty=()=>page.getByLabel('Quantity',{exact:true}).first();
 const add=()=>page.locator('button.w-full.h-12').filter({hasText:/Add to Cart|Update Cart/});
 const publicProduct=()=>page.request.get(`${API}/products/${state.product_slug}`);
 const assertOrderSnapshot=async()=>{
  const r=await page.request.get(`${API}/admin/orders/${state.order_id}`,{headers});expect(r.ok()).toBeTruthy();
  const order=(await r.json()).data;const item=order.items.find(i=>i.product_name===name);
  expect(item).toBeTruthy();expect(item.quantity).toBe(250);expect(Number(item.total_price)).toBe(2250);
  await expect(page.getByText(/₹2,250(?:\.00)?/).first()).toBeVisible();
 };
 const saveProduct=async(label='Save Changes')=>{
  const response=page.waitForResponse(r=>r.url().endsWith(`/admin/products/${state.product_id}`)&&r.request().method()==='PATCH');
  await page.getByRole('button',{name:label,exact:true}).click();expect((await response).ok()).toBeTruthy();
 };
 try{
 await step('pr-01',null,async()=>{await page.getByRole('link',{name:'Products',exact:true}).click();await expect(page.getByRole('link',{name:'Add Product'})).toBeVisible();});
 await step('pr-02',page.getByRole('link',{name:'Add Product'}),async el=>{await el.click();await expect(page.getByLabel('Product Name *',{exact:true})).toBeVisible();});
 await type('pr-03',page.getByLabel('Product Name *',{exact:true}),name);
 state.product_name=name;state.product_slug=name.toLowerCase().replaceAll(' ','-');save(state);
 await step('pr-04',page.getByLabel('Slug *',{exact:true}),async el=>{await expect(el).toHaveValue(state.product_slug);});
 await type('pr-05',page.getByLabel('Short Description *',{exact:true}),'Elegant wedding invitations, printed on premium paper for your celebration.');
 await type('pr-06',page.locator('[contenteditable="true"]').first(),'Beautiful invitation cards for your celebration. Compare sizes, paper, finish and quantity before ordering.');
 await step('pr-07',page.getByLabel('Category *',{exact:true}),async el=>{await el.selectOption(String(state.child_id));await expect(el).toHaveValue(String(state.child_id));});
 await step('pr-08',page.getByLabel('Badge',{exact:true}),async el=>{await el.selectOption('new');await page.getByLabel('Tags (comma-separated)').fill('wedding, invitations, premium');});
 await step('pr-09',page.getByLabel('Upload images'),async el=>{await el.setInputFiles(['front','back','detail'].map(n=>`qa-pipeline/playwright/fixtures/catalog-tutorial/${n}.png`));await expect(page.getByText(/Minimum of 1 photo met/)).toBeVisible({timeout:40_000});});
 await step('pr-10',page.getByLabel('Label for size 1',{exact:true}),async el=>{await el.fill('A6 Invitation');await page.getByLabel('Width for size 1',{exact:true}).fill('105');await page.getByLabel('Height for size 1',{exact:true}).fill('148');await expect(page.getByLabel('Width for size 1',{exact:true})).toHaveValue('105');});
 await step('pr-11',page.getByLabel('Label for paper type 1',{exact:true}),async el=>{await expect(el).not.toHaveValue('');});
 await step('pr-12',page.getByLabel('Price multiplier for finish 2',{exact:true}),async el=>{await page.getByLabel('Label for finish 1',{exact:true}).fill('Gold Foil');await page.getByLabel('Label for finish 2',{exact:true}).fill('Gold Foil + Matte');await expect(el).toHaveValue('1.05');});
 await step('pr-13',page.getByLabel('Price per unit for pricing tier 1',{exact:true}),async el=>{await expect(el).toHaveValue('12');await expect(page.getByLabel('Quantity for pricing tier 1',{exact:true})).toHaveValue('100');});
 await step('pr-14',page.getByLabel('Price per unit for pricing tier 2',{exact:true}),async el=>{await expect(el).toHaveValue('9');await expect(page.getByLabel('Price per unit for pricing tier 3',{exact:true})).toHaveValue('7');});
 await type('pr-15',page.getByLabel('Show on listing as',{exact:true}),'100');
 await step('pr-16',page.getByLabel('Min order',{exact:true}),async el=>{await el.fill('100');await page.getByLabel('Max order',{exact:true}).fill('2500');});
 await step('pr-17',page.getByLabel('Standard turnaround days'),async el=>{await expect(el).toHaveValue('5');await expect(page.getByRole('switch',{name:'Express',exact:true})).not.toBeChecked();});
 await page.getByRole('button',{name:'Inventory',exact:true}).click();
 await step('pr-18',page.getByRole('switch',{name:'Track inventory for this product'}),async el=>{await expect(el).not.toBeChecked();});
 await page.getByRole('button',{name:'SEO Settings',exact:true}).click();
 await step('pr-19',page.getByLabel('Meta Title',{exact:true}),async el=>{await el.fill('Foil Wedding Invitations | Urgent Printers');await page.getByLabel('Meta Description',{exact:true}).fill('Premium wedding invitations with clear quantity pricing, print options and standard turnaround.');});
 await step('pr-20',page.getByRole('button',{name:/No customization/}),async el=>{await el.click();});
 await step('pr-21',page.getByRole('button',{name:'Save as Draft',exact:true}),async el=>{const response=page.waitForResponse(r=>r.url().endsWith('/admin/products')&&r.request().method()==='POST');await el.click();const r=await response;expect(r.ok()).toBeTruthy();state.product_id=(await r.json()).data.id;save(state);await page.waitForURL('**/products');});
 await step('pr-22',null,async()=>{await page.goto(`${ADMIN}/products/${state.product_id}`);await expect(page.getByLabel('Product Name *',{exact:true})).toHaveValue(name);await expect(active()).not.toBeChecked();expect((await publicProduct()).status()).toBe(404);});
 await step('pr-23',active(),async el=>{await el.click();await saveProduct();expect((await publicProduct()).ok()).toBeTruthy();});
 await page.goto(`${SHOP}/auth/login`);await page.getByRole('button',{name:'Email',exact:true}).click();await page.locator('#email-address').fill(buyer.email);await page.locator('#password').fill(buyer.password);await page.getByRole('button',{name:'Sign In',exact:true}).click();await page.waitForURL('**/account',{timeout:30_000});
 const accept=page.getByRole('button',{name:'Accept',exact:true});if(await accept.count())await accept.click();
 const productUrl=`${SHOP}/products/${state.child_slug}/${state.product_slug}`;
 await step('pr-24',null,async()=>{await page.goto(`${SHOP}/products/${state.parent_slug}`);const tile=page.locator('nav').filter({has:page.getByRole('heading',{name:`Shop ${state.parent_name} by type`,exact:true})}).getByRole('link').filter({hasText:state.child_name});await expect(tile).toBeVisible();await tile.click();await expect(page.getByRole('link',{name,exact:true})).toBeVisible();});
 await step('pr-25',page.getByRole('link',{name,exact:true}),async el=>{await el.click();await expect(page.getByRole('heading',{name,level:1,exact:true})).toBeVisible();await expect.poll(()=>page.locator('img').evaluateAll(imgs=>imgs.some(i=>i.src.includes('product')&&i.complete&&i.naturalWidth>0))).toBeTruthy();});
 await step('pr-26',qty(),async el=>{await expect(el).toHaveValue('100');await expect(add()).toContainText('₹1,200.00');});
 await type('pr-27',qty(),'250');await expect(add()).toContainText('₹2,250.00');
 await step('pr-28',page.getByRole('button').filter({has:page.getByText('Gold Foil + Matte',{exact:true})}),async el=>{await el.click();await expect(add()).not.toContainText('₹2,250.00');await page.getByRole('button').filter({has:page.getByText('Gold Foil',{exact:true})}).click();await expect(add()).toContainText('₹2,250.00');});
 await step('pr-29',add(),async el=>{await el.click();await expect(add()).toContainText('Update Cart');});
 const summary=()=>page.getByRole('heading',{name:'Order Summary',exact:true}).locator('xpath=../..');
 await step('pr-30',null,async()=>{await page.goto(`${SHOP}/cart`);await expect(page.getByText(name,{exact:true})).toBeVisible();await expect(summary()).toContainText('₹2,250.00');await expect(qty()).toHaveValue('250');});
 await step('pr-31',page.getByRole('link',{name:/Proceed to Checkout/}),async el=>{await el.click();await page.waitForURL('**/checkout');});
 await step('pr-32',page.getByRole('button',{name:/Continue to Payment/}),async el=>{await expect(page.getByText('12 Demo Studio, Tutorial Road')).toBeVisible();await el.click();});
 await step('pr-33',page.getByRole('button',{name:/Cash on Delivery/}),async el=>{await el.click();});
 await step('pr-34',page.getByRole('button',{name:/Review Order/}),async el=>{await el.click();await expect(page.getByText('Review Your Order')).toBeVisible();await expect(page.getByText('Confirming prices…')).toHaveCount(0);await expect(page.locator('div.rounded-2xl').filter({hasText:'Price Breakdown'}).first()).toContainText('₹2,250.00');});
 await step('pr-35',page.getByRole('button',{name:/^Place Order/}),async el=>{const response=page.waitForResponse(r=>/\/orders\/?$/.test(new URL(r.url()).pathname)&&r.request().method()==='POST');await el.click();const r=await response;expect(r.ok()).toBeTruthy();const order=(await r.json()).data;state.order_id=order.id;state.order_number=order.orderNumber??order.order_number;save(state);await page.waitForURL('**/checkout/confirmation/**',{timeout:60_000});});
 await step('pr-36',null,async()=>{await expect(page.getByText(name,{exact:true})).toBeVisible();await expect(page.getByText('Pay ₹2,250.00 in cash')).toBeVisible();});
 await step('pr-37',null,async()=>{await page.goto(`${ADMIN}/orders/${state.order_id}`);await expect(page.getByText(name,{exact:true})).toBeVisible();await assertOrderSnapshot();});
 await step('pr-38',null,async()=>{await page.goto(`${ADMIN}/products/${state.product_id}`);await page.getByLabel('Short Description *',{exact:true}).fill(updated);await expect(page.getByLabel('Slug *',{exact:true})).toHaveValue(state.product_slug);await saveProduct();});
 await step('pr-39',null,async()=>{await page.goto(productUrl);await expect(page.getByText(updated,{exact:true})).toBeVisible();});
 await page.goto(`${ADMIN}/products/${state.product_id}`);
 await step('pr-40',active(),async el=>{await el.click();await saveProduct('Save as Draft');await expect(active()).not.toBeChecked();});
 await step('pr-41',null,async()=>{expect((await publicProduct()).status()).toBe(404);await page.goto(`${SHOP}/products/${state.child_slug}`);await expect(page.getByText('No products found',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name,exact:true})).toHaveCount(0);});
 await step('pr-42',null,async()=>{await page.goto(`${ADMIN}/orders/${state.order_id}`);await expect(page.getByText(name,{exact:true})).toBeVisible();await assertOrderSnapshot();});
 await step('pr-43',page.getByRole('button',{name:'Cancel',exact:true}),async el=>{await el.click();await page.getByRole('button',{name:'Yes, cancel order'}).click();await expect(page.getByText('Cancelled',{exact:true}).first()).toBeVisible();state.order_cancelled=true;save(state);});
 await step('pr-44',null,async()=>{await expect(page.getByText(name,{exact:true})).toBeVisible();expect((await publicProduct()).status()).toBe(404);});
 state.product_inactive=true;save(state);
 writeFileSync('qa-pipeline/artifacts/runs/product-lifecycle-evidence.json',JSON.stringify({...state,outbound_providers:'fake',task_broker:'memory://'},null,2)+'\n');
 }finally{
  if(state.product_id){const r=await page.request.patch(`${API}/admin/products/${state.product_id}`,{headers,data:{status:'draft',is_active:false}});expect(r.ok()).toBeTruthy();}
  if(state.order_id&&!state.order_cancelled){const r=await page.request.post(`${API}/admin/orders/${state.order_id}/cancel`,{headers,data:{reason:'Development tutorial cleanup; do not fulfil'}});expect(r.ok()).toBeTruthy();}
 }
});
