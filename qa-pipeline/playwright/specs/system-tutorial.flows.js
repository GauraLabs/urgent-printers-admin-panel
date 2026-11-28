import {systemContext,expect,API} from './system-tutorial.helpers.js';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {readFileSync} from 'node:fs';
export async function runSystemTutorial(page,capture,kind){
 const c=await systemContext(page,capture,kind);const {step,type,state,save,admin,visit,choose,button,field,row,read,settle}=c;
 const dialog=()=>page.getByRole('dialog');
 const changeRole=label=>choose(page.locator('form').getByRole('combobox'),label);
 const formSave=async()=>{await button('Save Changes').click();await expect(page.locator('form')).toHaveCount(0);};
 const actions=async name=>{await row(name).getByRole('button').last().click();};
 const edit=async name=>{await actions(name);await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await settle();};
 try{
 if(kind==='staff'){
  const name='Kavya Training',email=`kavya.training.${Date.now()}@example.com`;
  await step(1,null,()=>admin('/staff'));
  await step(2,page.getByRole('heading',{name:'Role Permissions Matrix'}));
  await step(3,button('Add Member'),el=>el.click());
  await type(4,field('name'),name);await type(5,field('email'),email);
  await step(6,page.locator('form').getByRole('combobox'),()=>changeRole('Customer Support'));
  await step(7,page.getByRole('radiogroup',{name:'Sign-in setup'}));
  await step(8,button('Send Invite'),async el=>{await el.click();await expect(row(name)).toBeVisible();expect((await read(`/staff/${state.lesson_staff_id}`)).is_active).toBe(true);});
  await step(9,row(name).getByRole('button').last(),el=>el.click());
  await step(10,page.getByRole('menuitem',{name:'Edit',exact:true}),el=>el.click());
  await type(11,field('phone_number'),'+919876500188');
  await step(12,field('password'));
  await step(13,page.getByRole('button',{name:/Customise Permissions/}),el=>el.click());
  await step(14,page.locator('form').getByRole('button',{name:/^Orders/}),async el=>{await el.click();const permission=page.locator('form').getByRole('switch').nth(1);await expect(permission).toBeChecked();await permission.click();await expect(permission).not.toBeChecked();});
  await step(15,button('Save Changes'),formSave);
  await edit(name);await step(16,page.locator('form').getByRole('combobox'),()=>changeRole('Operations Manager'));
  await step(17,button('Save Changes'),async()=>{await formSave();await expect(row(name)).toContainText('Operations Manager');});
  await actions(name);await step(18,page.getByRole('menuitem',{name:'Deactivate',exact:true}),el=>el.click());
  await step(19,dialog().getByRole('button',{name:/Deactivate/}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);await expect(row(name)).toHaveCount(0);});
  const inactive=page.getByText(/Show deactivated/i).locator('xpath=..').getByRole('switch');
  await step(20,inactive,async el=>{await el.click();await expect(row(name)).toContainText('Inactive');});
  await step(21,row(name).getByRole('button').last(),()=>edit(name));
  await step(22,page.locator('form').getByRole('switch').first(),async el=>{await el.click();await formSave();await expect(row(name)).toContainText('Active');});
  await step(23,row(name).getByRole('button').last(),async()=>{await actions(name);const response=page.waitForResponse(r=>r.url().includes('/unlock-login'));await page.getByRole('menuitem',{name:'Unlock login',exact:true}).click();expect((await response).ok()).toBeTruthy();});
  await step(24,null,async()=>{await admin('/staff');await expect(row(name)).toContainText('Active');expect((await read(`/staff/${state.lesson_staff_id}`)).role).toBe('operations_manager');});
 }
 if(kind==='staff-notifications'){
  for(const id of [state.no_phone_staff,state.contact_staff])for(const event of ['order.created','order.status_changed'])for(const channel of ['in_app','email','sms','whatsapp','push']){const r=await page.request.put(`${API}/admin/staff-notifications/preferences`,{headers:c.headers,data:{admin_user_id:id,event_type:event,channel,enabled:false}});expect(r.ok()).toBeTruthy();}
  const contact=()=>row('Training Operations'),support=()=>row('Training Support');const cell=(r,n)=>r().getByRole('switch').nth(n);
  await step(1,null,()=>admin('/staff/notifications'));
  await step(2,page.getByRole('tab',{name:'New Order Placed'}),el=>el.click());
  await step(3,support());await step(4,cell(support,0),async el=>{await el.click();await expect(el).toBeChecked();});
  await step(5,cell(support,1),async el=>{await el.click();await expect(el).toBeChecked();});
  await step(6,cell(support,2),async el=>{await expect(el).toBeDisabled();await expect(cell(support,3)).toBeDisabled();});
  await step(7,cell(contact,2),async el=>{await el.click();await expect(el).toBeChecked();});
  await step(8,cell(contact,3),async el=>{await el.click();await expect(el).toBeChecked();});
  await step(9,cell(contact,4));
  await step(10,page.getByRole('tab',{name:'Order Status Changed'}),async el=>{await el.click();await expect(el).toHaveAttribute('aria-selected','true');await page.waitForLoadState('networkidle');});
  await step(11,cell(support,0),async el=>{await el.click();await expect(el).toBeChecked();});
  await step(12,cell(support,1),async el=>{await el.click();await expect(el).toBeChecked();});
  await step(13,null,async()=>{await admin('/staff/notifications');await expect(cell(support,0)).toBeChecked();await expect(cell(support,1)).toBeChecked();await page.getByRole('tab',{name:'Order Status Changed'}).click();await expect(cell(support,0)).toBeChecked();await expect(cell(support,1)).toBeChecked();});
  await page.getByRole('tab',{name:'New Order Placed'}).click();
  await step(14,cell(support,1),async el=>{await el.click();await expect(el).not.toBeChecked();});
  await step(15,null,async()=>{await admin('/staff/notifications');await expect(cell(support,1)).not.toBeChecked();await expect(cell(support,0)).toBeChecked();});
 }
 if(kind==='activity-log'){
  await step(1,null,()=>admin('/staff/activity-log'));await step(2,page.getByRole('table').getByRole('row').first());
  const combos=()=>page.getByRole('combobox');const actor=await read('/auth/me');
  await step(3,combos().nth(0),()=>choose(combos().nth(0),actor.name));
  await step(4,combos().nth(1),()=>choose(combos().nth(1),'admin user'));
  await step(5,combos().nth(2),async()=>{await choose(combos().nth(2),'Staff Updated');await expect(page.getByRole('row').filter({hasText:'Staff Updated'}).first()).toBeVisible();});
  await step(6,page.getByRole('table'));
  let file;await step(7,button('Export CSV'),async el=>{const download=page.waitForEvent('download');await el.click();file=await download;await file.saveAs(join(homedir(),'.config/urgentprinters-tutorials/system-activity-export.csv'));expect(file.suggestedFilename()).toContain('activity-log');});
  await step(8,button('Export CSV'),async()=>{expect(readFileSync(join(homedir(),'.config/urgentprinters-tutorials/system-activity-export.csv'),'utf8')).toContain('staff.updated');});
  await step(9,combos().nth(2),()=>choose(combos().nth(2),'All actions'));
  await step(10,combos().nth(2),async()=>{await choose(combos().nth(2),'Staff Deactivated');await expect(page.getByRole('row').filter({hasText:'Staff Deactivated'}).first()).toBeVisible();});
  await step(11,null,async()=>{await choose(combos().nth(0),'All admins');await choose(combos().nth(1),'All resources');await choose(combos().nth(2),'All actions');});
  await step(12,page.getByRole('button',{name:/Next|Previous/}).first());
 }
 if(kind==='settings-overview'){
  await step(1,null,()=>admin('/settings/general'));
  await step(2,page.getByText('Business Info',{exact:true}));await step(3,page.getByText('Contact',{exact:true}));await step(4,page.getByText('Localisation',{exact:true}));
  await step(5,page.getByRole('tab',{name:'Operations',exact:true}),async el=>{await el.click();await expect(page.getByText('Emergency: Halt New Orders')).toBeVisible();});
  await step(6,page.getByText('Turnaround',{exact:true}));
  await step(7,page.getByRole('tab',{name:'Notifications',exact:true}),async el=>{await el.click();await expect(page.getByText('Customer Notifications',{exact:true})).toBeVisible();});
  await step(8,page.getByText('Customer Notifications',{exact:true}));
  await step(9,null,()=>admin('/staff/notifications'));await admin('/settings/notifications');
  await step(10,page.getByRole('tab',{name:'Payments',exact:true}),async el=>{await el.click();await expect(page.getByText('Payment Gateways',{exact:true})).toBeVisible();await expect(page.getByRole('form',{name:'Cash on Delivery settings'})).toBeVisible();});
  await step(11,page.getByText('Cash on Delivery',{exact:true}));await step(12,page.getByRole('form',{name:'Cash on Delivery settings'}));
 }
 if(kind==='order-controls'){
  await c.customer();await step(1,null,()=>admin('/settings/operations'));
  const halt=()=>page.getByText('Emergency: Halt New Orders').locator('xpath=..').locator('xpath=..').locator('xpath=..');
  // A clean development precondition is recorded separately from the taught actions.
  expect((await read('/settings/order-halt'))?.is_halted??false).toBe(false);
  await step(2,halt());await step(3,halt().getByRole('switch'),el=>el.click());
  await type(4,dialog().locator('textarea').nth(0),'We are checking a printing issue. Please try again shortly.');
  await type(5,dialog().locator('textarea').nth(1),'Training incident: verify production availability before resuming.');
  await step(6,dialog().getByRole('button',{name:'Halt Orders',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);expect((await read('/settings/order-halt')).is_halted).toBe(true);});
  await step(7,halt());
  await step(8,null,async()=>{await visit();await expect(page.getByText('We are checking a printing issue. Please try again shortly.').first()).toBeVisible();await expect(page.getByText('Training incident: verify production availability before resuming.')).toHaveCount(0);});
  await step(9,null,async()=>{await c.checkout(true);await expect(page.getByText('Orders temporarily paused',{exact:true})).toBeVisible();await page.getByRole('button',{name:/Orders Paused/i}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:/Orders Paused/i})).toBeDisabled();});
  await step(10,null,()=>admin('/settings/operations'));
  await step(11,halt().getByRole('switch'),el=>el.click());
  await step(12,dialog().getByRole('button',{name:'Resume Orders',exact:true}),async el=>{await el.click();await expect(dialog()).toHaveCount(0);expect((await read('/settings/order-halt')).is_halted).toBe(false);});
  await step(13,null,async()=>{await visit();await expect(page.getByText('We are checking a printing issue. Please try again shortly.')).toHaveCount(0);});
  await step(14,null,async()=>{await c.checkout(true);await expect(page.getByText('Orders temporarily paused',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:/^Place Order/}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:/^Place Order/})).toBeEnabled();});
  await step(15,null,async()=>{await admin('/settings/operations');await expect(halt().getByRole('switch')).not.toBeChecked();});
 }
 if(kind==='cod-payments'){
  await c.customer();await step(1,null,()=>admin('/settings/payments'));
  const cod=()=>page.getByRole('form',{name:'Cash on Delivery settings'}),enable=()=>page.getByRole('switch',{name:'Enable COD'}),min=()=>page.getByRole('spinbutton',{name:'Minimum order amount (₹)',exact:true}),max=()=>page.getByRole('spinbutton',{name:'Maximum order amount (₹)',exact:true});
  await step(2,cod());
  if(await enable().isChecked()){await enable().click();await button('Save COD settings').click();await expect(button('Save COD settings')).toBeDisabled();}
  await step(3,enable(),el=>el.click());await type(4,min(),'500');await type(5,max(),'5000');
  const saveCod=async()=>{await button('Save COD settings').click();await expect(button('Save COD settings')).toBeDisabled();};
  await step(6,button('Save COD settings'),saveCod);
  await step(7,null,async()=>{await admin('/settings/payments');await expect(min()).toHaveValue('500');await expect(max()).toHaveValue('5000');});
  const choice=()=>page.getByRole('button',{name:/Cash on Delivery/});
  await step(8,null,async()=>{await c.checkout();await expect(choice()).toHaveAttribute('aria-disabled','false');});
  await step(9,choice(),el=>el.click());
  await step(10,button('Review Order'),async el=>{await el.click();await expect(page.getByText('Confirming prices…')).toHaveCount(0);await expect(page.getByRole('button',{name:/^Place Order/})).toBeEnabled();});
  await admin('/settings/payments');await type(11,max(),'1000');await step(12,button('Save COD settings'),saveCod);
  await step(13,null,async()=>{await c.checkout();await expect(choice()).toHaveAttribute('aria-disabled','true');await expect(choice()).toContainText(/up to|between/);});
  await admin('/settings/payments');await step(14,enable(),el=>el.click());await step(15,button('Save COD settings'),saveCod);
  await step(16,null,async()=>{await c.checkout();await expect(choice()).toHaveAttribute('aria-disabled','true');await expect(choice()).toContainText('currently unavailable');});
  await admin('/settings/payments');await step(17,enable(),async el=>{await el.click();await max().fill('5000');});
  await step(18,button('Save COD settings'),async()=>{await saveCod();await admin('/settings/payments');await expect(enable()).toBeChecked();await expect(max()).toHaveValue('5000');});
  await step(19,null,async()=>{await c.checkout();await expect(choice()).toHaveAttribute('aria-disabled','false');});
 }
 if(kind==='system-health'){
  await step(1,null,async()=>{await admin('/system');await expect(page.getByText(/services healthy/)).toBeVisible();});
  await step(2,page.getByRole('heading',{name:'Service Status',exact:true}));
  await step(3,page.getByText('PostgreSQL',{exact:true}).locator('xpath=..').locator('xpath=..').locator('xpath=..'));
  await step(4,button('Refresh'),async el=>{await el.click();await expect(el).toBeEnabled();});
  await step(5,page.getByRole('button',{name:'Re-check PostgreSQL',exact:true}),async el=>{const r=page.waitForResponse(r=>r.url().includes('/health/postgresql/check'));await el.click();expect((await r).ok()).toBeTruthy();});
  await step(6,page.getByText('Razorpay',{exact:true}).locator('xpath=..').locator('xpath=..').locator('xpath=..'));
  await step(7,page.getByRole('heading',{name:'Pricing Diagnostics'}));
  await step(8,page.getByRole('heading',{name:'Background Jobs'}));
  await step(9,page.getByRole('table').getByRole('row').first());
  await step(10,page.getByRole('heading',{name:'Error Log',exact:true}));
  await step(11,page.getByRole('heading',{name:'Error Log',exact:true}));
  await step(12,button('Refresh'),async el=>{await el.click();await expect(el).toBeEnabled();});
 }
 if(kind==='pricing-diagnostics'){
  const evidence=await read('/price-mismatches?limit=100');const sample=evidence.items.find(r=>Number(r.id)===state.mismatch_id);expect(sample).toBeTruthy();expect(Number(sample.diff_total)).toBe(Number(sample.client_total)-Number(sample.server_total));
  await admin('/system');await step(1,page.getByRole('link',{name:/Unexplained price mismatches/}),async el=>{await el.click();await expect(page.getByRole('heading',{name:'Mismatches',exact:true})).toBeVisible();});
  await step(2,page.getByRole('heading',{name:'Last 7 days',exact:true}));
  const status=()=>page.getByRole('combobox',{name:'Status filter'}),stage=()=>page.getByRole('combobox',{name:'Stage filter'}),cause=()=>page.getByRole('combobox',{name:'Cause filter'});
  const example=()=>row('operator-training-price-check'),sheet=()=>page.getByRole('dialog');
  await step(3,status(),()=>choose(status(),'Unresolved'));await step(4,stage(),()=>choose(stage(),'Preview'));await step(5,cause(),()=>choose(cause(),'Unexplained'));
  await step(6,example(),async el=>{await el.click();await expect(sheet()).toBeVisible();});
  await step(7,sheet().getByRole('heading',{name:'Pricing',exact:true}));
  await step(8,sheet().getByRole('heading',{name:'Context',exact:true}));
  await type(9,page.getByLabel('Note (optional)'),'Training example: compared preview and server amount; refreshed the customer quote.');
  await step(10,button('Mark resolved'),async el=>{await el.click();await expect(sheet()).toHaveCount(0);});
  await step(11,status(),async()=>{await choose(status(),'Resolved');await example().click();});
  await step(12,page.getByLabel('Note (optional)'),async el=>{await expect(el).toContainText('compared preview');});
  await step(13,button('Unresolve'),async el=>{await el.click();await expect(sheet()).toHaveCount(0);});
  await step(14,status(),async()=>{await choose(status(),'Unresolved');await expect(example()).toBeVisible();});
  await example().click();await type(15,page.getByLabel('Note (optional)'),'Training example follow-up: rechecked the quote and confirmed matching amounts.');
  await step(16,button('Mark resolved'),async el=>{await el.click();await expect(sheet()).toHaveCount(0);});
  await step(17,null,async()=>{await admin('/system/price-mismatches');await choose(status(),'Resolved');await example().click();await expect(page.getByLabel('Note (optional)')).toContainText('rechecked the quote');});
 }
 state.completed=[...new Set([...(state.completed??[]),kind])];save();
 }finally{await c.cleanup();}
}
