import {customerContext,expect} from './customer-tutorial.helpers.js';
export async function runCustomerTutorial(page,capture,feature){
 const c=await customerContext(page,capture,feature),{state,step,type,read,admin,visit,button,choose,profile,row,reviewRow,dialog,login,productReviews,publicSection,icon,settle}=c;
 const search=()=>page.getByPlaceholder('Search name, email…');
 const filter=()=>page.getByRole('combobox').first();
 const tab=async name=>{const el=page.getByRole('tab',{name,exact:false});await el.click();await expect(el).toHaveAttribute('aria-selected','true');await page.waitForLoadState('networkidle');await settle();};
 if(feature==='customer-management'){
  await step(1,null,()=>admin('/customers'));
  await step(2,page.getByRole('table').getByRole('row').first());
  await type(3,search(),state.email);await expect(row()).toBeVisible();
  await step(4,filter(),async()=>{await choose(filter(),'Active');await expect(row()).toContainText('Active');});
  await step(5,row().getByRole('link',{name:state.customer_name,exact:true}),async el=>{await el.click();await expect(page.getByRole('heading',{name:state.customer_name,exact:true})).toBeVisible();});
  await step(6,page.getByRole('heading',{name:'Identity',exact:true}));
  await step(7,page.getByRole('heading',{name:'Order Summary',exact:true}));
  await step(8,page.getByRole('tab',{name:/^Orders/}),async()=>{await tab(/^Orders/);await expect(page.getByText('Order History',{exact:false}).first()).toBeVisible();});
  await step(9,page.getByRole('link',{name:state.order_number,exact:true}),async el=>{await el.click();await expect(page.getByText(state.product_name,{exact:true}).first()).toBeVisible();});
  await step(10,null,profile);
  await step(11,page.getByRole('tab',{name:/^Addresses/}),async()=>{await tab(/^Addresses/);await expect(page.getByText('12 Demo Studio, Tutorial Road',{exact:false})).toBeVisible();});
  await step(12,page.getByRole('tab',{name:'Activity',exact:true}),async()=>{await tab('Activity');await expect(page.locator('ol').getByText(new RegExp(state.order_number)).first()).toBeVisible();});
  await step(13,page.getByRole('link',{name:'Send Email',exact:true}),async el=>{await expect(el).toHaveAttribute('href','mailto:'+state.email);});
  await step(14,button('Ban Customer'),el=>el.click());
  await step(15,dialog());
  await step(16,dialog().getByRole('button',{name:'Ban Customer',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);const customer=await read(`/customers/${state.customer_id}`);expect(customer.status).toBe('banned');await expect(button('Reinstate Customer')).toBeVisible();});
  await step(17,null,async()=>{await admin('/customers');await search().fill(state.email);await choose(filter(),'Banned');await expect(row()).toContainText('Banned');});
  // Credentials and the expected denied login occur outside the captured step.
  // Capture the actual error state; never store typed passwords in run artifacts.
  await login({banned:true});
  await step(18,null,async()=>{await expect(page.getByText('We couldn’t sign you in right now. Please try again.',{exact:true})).toBeVisible();});
  await step(19,null,profile);
  await step(20,button('Reinstate Customer'),el=>el.click());
  await step(21,dialog().getByRole('button',{name:'Reinstate',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);expect((await read(`/customers/${state.customer_id}`)).status).toBe('active');});
  await login();await step(22,null,async()=>{await expect(page).toHaveURL(/\/account$/);await expect(page.getByRole('heading').first()).toBeVisible();});
  await step(23,null,async()=>{await profile();expect((await read(`/customers/${state.customer_id}`)).status).toBe('active');await expect(button('Ban Customer')).toBeVisible();});
  await admin('/customers');await search().fill(state.email);await choose(filter(),'Active');
  await step(24,search(),async el=>{await el.fill('');await choose(filter(),'All statuses');await expect(search()).toHaveValue('');});
 }
 if(feature==='customer-reviews'){
  const title='Lovely paper and clear printing',body='The invitation colours were clear and the paper felt lovely.',reply='Thank you for sharing your experience. We are glad you liked the print quality.',corrected='Thank you for your feedback. We are happy you liked the paper and clear printing.';
  await login();await step(1,null,async()=>{await visit(`/account/orders/${state.order_id}`);await expect(page.getByText('Delivered',{exact:true}).first()).toBeVisible();});
  await step(2,page.getByRole('link',{name:/Write a Review/}),async el=>{await el.click();await expect(page.getByRole('heading',{name:'Leave a Review',exact:true})).toBeVisible();});
  await step(3,page.getByRole('radio',{name:'4 stars',exact:true}),async el=>{await el.click();await expect(el).toBeChecked();});
  await type(4,page.getByPlaceholder('e.g. Perfect quality for our conference'),title);
  await type(5,page.getByPlaceholder('Tell others about the print quality, delivery speed, and overall experience…'),body);
  await step(6,button('Submit Review'),async el=>{await el.click();await expect(page.getByText('Thank You!',{exact:true})).toBeVisible();await expect(page.getByText(/Your review is awaiting approval/)).toBeVisible();});
  await step(7,null,()=>admin('/reviews'));
  await step(8,filter(),async()=>{await choose(filter(),'Pending');await expect(reviewRow()).toBeVisible();});
  await step(9,reviewRow(),async el=>{await expect(el).toContainText(body);});
  await step(10,reviewRow().getByRole('link',{name:state.order_number,exact:true}),async el=>{await el.click();await expect(page.getByText(state.product_name,{exact:true}).first()).toBeVisible();});
  await step(11,null,async()=>{await productReviews();await expect(publicSection().getByText(title,{exact:true})).toHaveCount(0);});
  await admin('/reviews');await choose(filter(),'Pending');
  await step(12,icon(reviewRow(),'circle-check'),async el=>{await el.click();await expect(reviewRow()).toHaveCount(0);});
  await step(13,filter(),async()=>{await choose(filter(),'Approved');await expect(reviewRow()).toContainText('Approved');});
  await step(14,null,async()=>{await productReviews();await expect(publicSection().getByText(title,{exact:true})).toBeVisible();await expect(publicSection().getByText(body,{exact:true})).toBeInViewport();await expect(publicSection().getByText('Verified Purchase',{exact:true})).toBeVisible();});
  await admin('/reviews');await choose(filter(),'Approved');
  await step(15,icon(reviewRow(),'message-square'),async el=>{await el.click();await expect(dialog().getByRole('heading',{name:'Reply to Review'})).toBeVisible();});
  await type(16,dialog().getByPlaceholder('Write your official response…'),reply);
  await step(17,dialog().getByRole('button',{name:'Post Reply',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await expect(reviewRow()).toContainText('Yes');});
  await step(18,icon(reviewRow(),'message-square'),async el=>{await el.click();await expect(dialog().getByPlaceholder('Write your official response…')).toHaveValue(reply);});
  await type(19,dialog().getByPlaceholder('Write your official response…'),corrected);
  await step(20,dialog().getByRole('button',{name:'Post Reply',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await icon(reviewRow(),'message-square').click();await expect(dialog().getByPlaceholder('Write your official response…')).toHaveValue(corrected);});
  await dialog().getByRole('button',{name:'Cancel',exact:true}).click();
  await step(21,icon(reviewRow(),'circle-x'),async el=>{await el.click();await expect(reviewRow()).toHaveCount(0);});
  await step(22,filter(),async()=>{await choose(filter(),'Rejected');await expect(reviewRow()).toContainText('Rejected');await expect(reviewRow()).toContainText('Yes');});
  await step(23,null,async()=>{await productReviews();await expect(publicSection().getByText(title,{exact:true})).toHaveCount(0);});
  await admin('/reviews');await choose(filter(),'Rejected');
  await step(24,icon(reviewRow(),'circle-check'),async el=>{await el.click();await productReviews();await expect(publicSection().getByText(title,{exact:true})).toBeVisible();});
  await step(25,null,async()=>{await visit(`/account/orders/${state.order_id}`);await expect(page.getByText('Already reviewed',{exact:true})).toBeVisible();await page.getByText('Already reviewed',{exact:true}).evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));});
 }
 await c.finish();
}
