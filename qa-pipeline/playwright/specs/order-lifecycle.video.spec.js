import {test,expect as baseExpect} from '../capture.js';
import {setup,ADMIN,SHOP,API,folder} from './catalog-tutorial.helpers.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const expect=baseExpect.configure({timeout:30_000});
const statePath=join(folder,'order-lifecycle-session.json');
const resumeRefund=process.env.TUTORIAL_RESUME_REFUND==='1';
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,captureOptions:{plan:'qa-pipeline/artifacts/plans/order-lifecycle-plan.json',feature:resumeRefund?'Order Lifecycle Refund':'Order Lifecycle',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',screenshotTimeout:60_000,persistEachStep:true}});
test('full order lifecycle, proof revision, production, delivery and refund',async({page,capture})=>{
 test.setTimeout(1_200_000);
 const state=JSON.parse(readFileSync(statePath));const save=()=>writeFileSync(statePath,JSON.stringify(state,null,2)+'\n',{mode:0o600});
 const {headers,step,type}=await setup(page,capture,'order-lifecycle');
 // Analytics are irrelevant to the demonstration. Resolve beacons locally;
 // every catalogue/auth/order/payment/proof/shipping request still uses the real API.
 await page.context().route(/https:\/\/([^/]+\.)?(google-analytics\.com|clarity\.ms)\//,route=>route.fulfill({status:204,body:''}));
 const asset=name=>`qa-pipeline/tutorials/order-lifecycle/assets/${name}`;
 const order=async(id=state.order_id)=>{const r=await page.request.get(`${API}/admin/orders/${id}`,{headers});expect(r.ok()).toBeTruthy();return(await r.json()).data;};
 const assertStatus=async(status)=>{await expect.poll(async()=>(await order()).status).toBe(status);};
 const adminOrder=async()=>{await page.goto(`${ADMIN}/orders/${state.order_id}`);await expect(page.getByText(state.order_number,{exact:true}).first()).toBeVisible();};
 const customerOrder=async()=>{await page.goto(`${SHOP}/account/orders/${state.order_id}`);await expect(page.getByText(state.product_name,{exact:true}).first()).toBeVisible();};
 const proofArea=()=>page.getByRole('heading',{name:'Artwork Proofs',exact:true}).locator('xpath=..').locator('xpath=..');
 const dialog=()=>page.getByRole('dialog');
 const shipping=()=>page.getByRole('heading',{name:'Shipping',exact:true}).locator('xpath=..');
 const queueRow=()=>page.getByRole('row').filter({hasText:state.order_number});
 const selectStatus=async(label)=>{await dialog().getByRole('combobox').click();await page.getByRole('option',{name:label,exact:true}).click();};
 const shipStatus=async(label)=>{await shipping().getByRole('combobox').click();await page.getByRole('option',{name:label,exact:true}).click();};
 const proofFile=()=>dialog().locator('input[type=file]');
 try{
 if(!resumeRefund){
 // Credentials are entered outside all captured steps.
 await page.goto(`${SHOP}/auth/login`);await page.getByRole('button',{name:'Email',exact:true}).click();await page.locator('#email-address').fill(state.email);await page.locator('#password').fill(state.password);await page.getByRole('button',{name:'Sign In',exact:true}).click();await page.waitForURL('**/account');
 const accept=page.getByRole('button',{name:'Accept',exact:true});if(await accept.count())await accept.click();
 const productUrl=`${SHOP}/products/${state.category_slug}/${state.product_slug}`;
 const qty=()=>page.getByLabel('Quantity',{exact:true}).first();const add=()=>page.locator('button.w-full.h-12').filter({hasText:/Add to Cart|Update Cart/});
 await step('or-01',null,async()=>{await page.goto(productUrl);await expect(page.getByRole('heading',{name:state.product_name,exact:true})).toBeVisible();});
 await type('or-02',qty(),'250');await expect(add()).toContainText('₹2,250.00');
 await step('or-03',page.getByLabel('Upload artwork file'),async el=>{await el.setInputFiles(asset('customer-artwork.png'));await expect(page.getByText('customer-artwork.png',{exact:true})).toBeVisible();});
 await step('or-04',page.getByText('customer-artwork.png',{exact:true}),async el=>{await expect(el).toBeVisible();});
 await step('or-05',add(),async el=>{await el.click();await expect(add()).toContainText('Update Cart');});
 await step('or-06',null,async()=>{await page.goto(`${SHOP}/cart`);await expect(page.getByText(state.product_name,{exact:true})).toBeVisible();await expect(qty()).toHaveValue('250');});
 await step('or-07',page.getByRole('link',{name:/Proceed to Checkout/}),async el=>{await el.click();await page.waitForURL('**/checkout');});
 await step('or-08',page.getByRole('button',{name:/Continue to Payment/}),async el=>{await expect(page.getByText('12 Demo Studio, Tutorial Road')).toBeVisible();await el.click();});
 await step('or-09',page.getByRole('button',{name:/Cash on Delivery/}),async el=>{await el.click();});
 await step('or-10',page.getByRole('button',{name:/Review Order/}),async el=>{await el.click();await expect(page.getByText('Confirming prices…')).toHaveCount(0);await expect(page.locator('div.rounded-2xl').filter({hasText:'Price Breakdown'}).first()).toContainText('₹2,250.00');});
 await step('or-11',page.getByRole('button',{name:/^Place Order/}),async el=>{const result=page.waitForResponse(r=>/\/orders\/?$/.test(new URL(r.url()).pathname)&&r.request().method()==='POST');await el.click();const r=await result;expect(r.ok()).toBeTruthy();const o=(await r.json()).data;state.order_id=o.id;state.order_number=o.orderNumber??o.order_number;save();await page.waitForURL('**/checkout/confirmation/**',{timeout:60_000});});
 await step('or-12',null,customerOrder);
 await step('or-13',null,async()=>{await adminOrder();const o=await order();expect(o.items[0].artwork_file_key).toBeTruthy();expect(o.items[0].quantity).toBe(250);expect(Number(o.items[0].total_price)).toBe(2250);state.item_id=o.items[0].id;save();});
 await type('or-14',page.getByPlaceholder(/Add a note as/),'Check artwork size and spelling before proof approval.');
 await step('or-15',page.getByPlaceholder(/Add a note as/).locator('xpath=..').getByRole('button'),async el=>{await el.click();await expect(page.getByText('Check artwork size and spelling before proof approval.',{exact:true})).toBeVisible();});
 await step('or-16',page.getByRole('button',{name:'Change Status',exact:true}),async el=>{await el.click();await selectStatus('Confirmed');});
 await step('or-17',dialog().getByRole('button',{name:'Update Status',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await assertStatus('confirmed');});
 await step('or-18',page.getByRole('button',{name:'Download Invoice',exact:true}),async el=>{const download=page.waitForEvent('download');await el.click();const file=await download;mkdirSync('qa-pipeline/artifacts/video/renders/order-lifecycle',{recursive:true});await file.saveAs('qa-pipeline/artifacts/video/renders/order-lifecycle/order-invoice.pdf');const bytes=readFileSync('qa-pipeline/artifacts/video/renders/order-lifecycle/order-invoice.pdf');expect(bytes.subarray(0,4).toString()).toBe('%PDF');});
 await step('or-19',proofArea().getByRole('button',{name:'Upload Proof',exact:true}),async el=>{await el.click();await expect(dialog().getByText('Upload Artwork Proof',{exact:true})).toBeVisible();});
 await step('or-20',proofFile(),async el=>{await el.setInputFiles(asset('proof-v1.png'));await expect(dialog().getByText('proof-v1.png',{exact:true})).toBeVisible();});
 await step('or-21',dialog().getByRole('button',{name:'Upload & Save Draft',exact:true}),async el=>{await el.click();await expect(dialog().getByText('Uploaded successfully')).toBeVisible();});
 await step('or-22',dialog().getByRole('button',{name:/Send to Customer/}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await assertStatus('artwork_pending');});
 await customerOrder();
 await step('or-23',page.getByRole('button',{name:'Review Proof v1',exact:true}),async el=>{await el.click();await expect(page.getByRole('img',{name:'Artwork proof',exact:true})).toHaveJSProperty('naturalWidth',1600);});
 await step('or-24',page.getByRole('button',{name:'Request Revision',exact:true}),async el=>{await el.click();});
 await type('or-25',page.getByLabel('What needs to be changed?'),'Please increase the name size.');
 await step('or-26',page.getByRole('button',{name:'Submit Revision Request',exact:true}),async el=>{await el.click();await expect(page.getByText('Revision Requested',{exact:true})).toBeVisible();await assertStatus('confirmed');});
 await step('or-27',null,async()=>{await adminOrder();await expect(page.getByText(/Please increase the name size/).first()).toBeVisible();});
 await step('or-28',proofArea().getByRole('button',{name:'Upload Proof',exact:true}),async el=>{await el.click();await proofFile().setInputFiles(asset('proof-v2.png'));});
 await step('or-29',dialog().getByRole('button',{name:'Upload & Save Draft',exact:true}),async el=>{await el.click();await expect(dialog().getByText('Uploaded successfully')).toBeVisible();});
 await step('or-30',dialog().getByRole('button',{name:/Send to Customer/}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await assertStatus('artwork_pending');});
 await customerOrder();
 await step('or-31',page.getByRole('button',{name:'Review Proof v2',exact:true}),async el=>{await el.click();await expect(page.getByRole('img',{name:'Artwork proof',exact:true})).toHaveJSProperty('naturalWidth',1600);});
 await step('or-32',page.getByRole('button',{name:'Approve Artwork',exact:true}),async el=>{await el.click();await expect(page.getByText('Artwork Approved',{exact:true}).first()).toBeVisible();await assertStatus('artwork_approved');});
 await step('or-33',null,async()=>{await adminOrder();await expect(page.getByText('Artwork Approved',{exact:true}).first()).toBeVisible();});
 await step('or-34',null,async()=>{await page.goto(`${ADMIN}/printing-queue`);await page.getByRole('tab',{name:/Ready to Print/}).click();await expect(queueRow()).toBeVisible();});
 await step('or-35',queueRow().getByRole('button',{name:'Start Printing',exact:true}),async el=>{await el.click();await expect(queueRow()).toHaveCount(0);await assertStatus('printing');});
 await step('or-36',page.getByRole('tab',{name:/^Printing/}),async el=>{await el.click();await expect(queueRow()).toBeVisible();});
 await step('or-37',queueRow().getByRole('button',{name:'Mark Complete',exact:true}),async el=>{await el.click();await expect(queueRow()).toHaveCount(0);await assertStatus('ready_to_dispatch');});
 await step('or-38',page.getByRole('tab',{name:/Ready to Dispatch/}),async el=>{await el.click();await expect(queueRow()).toBeVisible();});
 await step('or-39',queueRow().getByRole('button',{name:'Create Shipment',exact:true}),async el=>{await el.click();await expect(page.getByText('Package Details',{exact:true})).toBeVisible();});
 await step('or-40',page.locator('input[name="weight_kg"]'),async el=>{await expect(el).toHaveValue('0.5');await expect(page.locator('input[name="length_cm"]')).toHaveValue('10');});
 // Return to the order's supported manual-shipment control, without booking a courier.
 await adminOrder();
 await step('or-41',page.getByRole('button',{name:'Enter shipment manually',exact:true}),async el=>{await el.click();await expect(dialog().getByText('Enter Shipment Manually',{exact:true})).toBeVisible();});
 await type('or-42',dialog().getByPlaceholder('e.g. Delhivery, local courier'),'Demo Courier');
 state.tracking=`DEMO-${state.order_id}`;save();
 await type('or-43',dialog().locator('input[name="tracking_number"]'),state.tracking);
 await step('or-44',dialog().getByRole('button',{name:'Save Shipment',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await assertStatus('shipped');await expect(shipping()).toContainText(state.tracking);});
 await step('or-45',null,async()=>{await customerOrder();await expect(page.getByText(state.tracking,{exact:true})).toBeVisible();});
 await adminOrder();
 await step('or-46',shipping().getByRole('combobox'),async()=>{await shipStatus('Picked Up');await expect.poll(async()=>(await order()).shipping.shipment_status).toBe('picked_up');});
 await step('or-47',shipping().getByRole('combobox'),async()=>{await shipStatus('In Transit');await expect.poll(async()=>(await order()).shipping.shipment_status).toBe('in_transit');});
 await step('or-48',shipping().getByRole('combobox'),async()=>{await shipStatus('Out for Delivery');await expect.poll(async()=>(await order()).shipping.shipment_status).toBe('out_for_delivery');});
 await step('or-49',shipping().getByRole('combobox'),async()=>{await shipStatus('Delivered');await expect(dialog().getByText('Confirm status change',{exact:true})).toBeVisible();});
 await step('or-50',dialog().getByRole('button',{name:'Confirm',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await assertStatus('delivered');});
 await step('or-51',null,async()=>{await customerOrder();await expect(page.getByText('Delivered',{exact:true}).first()).toBeVisible();});
 await step('or-52',null,async()=>{await adminOrder();const o=await order();expect(o.payment.status).toBe('pending');expect(o.status).toBe('delivered');});
 const fixture=spawnSync('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/order-lifecycle/refund-fixture.py'],{encoding:'utf8'});expect(fixture.status,fixture.stderr).toBe(0);Object.assign(state,JSON.parse(readFileSync(statePath)));
 await step('or-53',null,async()=>{await page.goto(`${ADMIN}/orders/${state.refund_order_id}`);await expect(page.getByText(state.refund_order_number,{exact:true}).first()).toBeVisible();expect((await order(state.refund_order_id)).payment.status).toBe('paid');});
 await step('or-54',page.getByRole('button',{name:'Cancel',exact:true}),async el=>{await el.click();await expect(page.getByRole('button',{name:'Yes, cancel order',exact:true})).toBeVisible();});
 await step('or-55',page.getByRole('button',{name:'Yes, cancel order',exact:true}),async el=>{await el.click();await expect(page.getByText('Cancelled',{exact:true}).first()).toBeVisible();});
 }else{
  expect((await order()).status).toBe('delivered');
  const sample=await order(state.refund_order_id);expect(sample.status).toBe('cancelled');expect(sample.payment.status).toBe('refund_pending');
  await page.goto(`${ADMIN}/orders/${state.refund_order_id}`);await expect(page.getByText(state.refund_order_number,{exact:true}).first()).toBeVisible();
 }
 await step('or-56',page.getByRole('button',{name:'Refund',exact:true}),async el=>{await el.click();await expect(dialog().getByRole('heading',{name:'Issue Refund',exact:true})).toBeVisible();});
 await step('or-57',dialog().getByLabel('Amount (₹)',{exact:true}),async el=>{await expect(el).toHaveValue('2250');});
 await step('or-58',dialog().getByRole('combobox'),async el=>{await el.click();await page.getByRole('option',{name:'Order Cancelled',exact:true}).click();});
 await step('or-59',dialog().getByRole('button',{name:'Issue Refund',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);});
 await step('or-60',null,async()=>{const o=await order(state.refund_order_id);expect(o.payment.status).toBe('refunded');expect(Number(o.payment.refund_amount)).toBe(2250);await expect(page.getByText('Refunded',{exact:true}).first()).toBeVisible();state.refund_reference=o.payment.refund_id;save();});
 await step('or-61',null,async()=>{await adminOrder();await assertStatus('delivered');});
 state.completed=true;save();const {password:secret,email:privateEmail,...evidence}=state;void secret;void privateEmail;
 writeFileSync('qa-pipeline/artifacts/runs/order-lifecycle-evidence.json',JSON.stringify({...evidence,outbound_providers:'fake',task_broker:'memory://',prepaid_fixture_simulated:true},null,2)+'\n');
 }finally{
  if(!state.completed){for(const id of [state.order_id,state.refund_order_id].filter(Boolean)){const o=await order(id);if(!['delivered','refunded','cancelled'].includes(o.status))await page.request.post(`${API}/admin/orders/${id}/cancel`,{headers,data:{reason:'Interrupted development order tutorial; do not fulfil'}});}}
  const r=await page.request.patch(`${API}/admin/products/${state.product_id}`,{headers,data:{status:'draft'}});expect(r.ok()).toBeTruthy();
 }
});
