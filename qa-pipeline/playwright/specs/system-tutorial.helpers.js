import {expect as baseExpect} from '../capture.js';
import {setup,ADMIN,SHOP,API,folder} from './catalog-tutorial.helpers.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
export const expect=baseExpect.configure({timeout:30_000});
export {ADMIN,SHOP,API};
export async function systemContext(page,capture,kind){
 const feature=`system-${kind}`,statePath=join(folder,'system-session.json');
 const state=JSON.parse(readFileSync(statePath)),content=JSON.parse(readFileSync(`qa-pipeline/tutorials/${feature}/content.json`));
 const save=()=>writeFileSync(statePath,JSON.stringify(state,null,2)+'\n',{mode:0o600});
 const shared=await setup(page,capture,feature),pending=[];
 page.on('response',response=>{
  const req=response.request(),path=new URL(response.url()).pathname;if(!response.ok()||!['POST','PUT','PATCH'].includes(req.method()))return;
  if(!/\/admin\/(staff$|settings\/(cod|order-halt)$)/.test(path))return;
  pending.push((async()=>{const data=(await response.json()).data;if(path.endsWith('/staff')&&req.method()==='POST'&&data.id){state.created_staff_ids.push(Number(data.id));state.lesson_staff_id=Number(data.id);}else if(data.updated_at){state.last_saved??={};state.last_saved[path.endsWith('/cod')?'cod':'halt']=data.updated_at;}save();})());
 });
 await page.context().route(/https:\/\/([^/]+\.)?(google-analytics\.com|clarity\.ms)\//,r=>r.fulfill({status:204,body:''}));
 await page.addInitScript(()=>{if(location.port==='3000')localStorage.setItem('cookie-consent','accepted');});
 // The fake upload URL accepts the file but may not materialize its original
 // thumbnail. Serve the exact PNG uploaded by this owned training customer.
 await page.context().route(/cdn\.urgentprinters\.com\/|\/_next\/image\?/,route=>{
  const request=new URL(route.request().url());const src=request.pathname==='/_next/image'?new URL(request.searchParams.get('url'),request.origin):request;
  if(src.hostname==='cdn.urgentprinters.com'&&state.customer_id&&new RegExp(`^/artworks/${state.customer_id}/[a-z0-9]+/customer-artwork\\.png$`).test(src.pathname))return route.fulfill({status:200,contentType:'image/png',body:readFileSync('qa-pipeline/tutorials/order-lifecycle/assets/customer-artwork.png')});
  return route.fallback();
 });

 const shot=(n,target)=>{const path=`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`,data=JSON.parse(readFileSync(path));const s=data.shots.find(s=>s.step_id===content.steps[n-1].id);s.emphasis=target?'zoom':'pause';writeFileSync(path,JSON.stringify(data,null,2)+'\n');};
 const settle=async()=>{await page.waitForTimeout(450);};
 const step=async(n,target,fn=async()=>{})=>{if(target)await target.scrollIntoViewIfNeeded();const box=target?await target.boundingBox():null;shot(n,box?.width>850?null:target);await shared.step(content.steps[n-1].id,target,async el=>{await fn(el);await settle();});await Promise.all(pending);};
 const type=async(n,target,text)=>{const box=await target.boundingBox();shot(n,box?.width>850?null:target);await shared.type(content.steps[n-1].id,target,text);};
 const read=async path=>{const r=await page.request.get(`${API}/admin${path}`,{headers:shared.headers});expect(r.ok()).toBeTruthy();return(await r.json()).data;};
 const admin=async path=>{await page.goto(ADMIN+path);await expect(page.locator('h1')).toBeVisible();await settle();};
 const visit=async(path='/')=>{await page.goto(SHOP+path);await settle();};
 const choose=async(target,label)=>{await target.click();await page.getByRole('option',{name:label,exact:true}).click();await page.waitForLoadState('networkidle',{timeout:20000});await settle();};
 const button=name=>page.getByRole('button',{name,exact:true});
 const field=name=>page.locator(`[name="${name}"]`);
 const row=name=>page.getByRole('row').filter({hasText:name}).first();
 const settingRow=label=>page.getByText(label,{exact:true}).locator('xpath=..').locator('xpath=..');
 const saveSetting=async(name,fn)=>{await button(name).click();await fn();};
 const customer=async()=>{
  await visit('/auth/login');await button('Email').click();await page.locator('#email-address').fill(state.email);await page.locator('#password').fill(state.password);const signed=page.waitForResponse(r=>r.url().includes('/auth/login')&&r.request().method()==='POST');await button('Sign In').click();const login=await (await signed).json();const data=login.data??login;const token=data.token??data.access_token??data.accessToken;expect(typeof token).toBe('string');state.customer_id=Number(JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).sub);save();await page.waitForURL('**/account');const cleared=await page.request.delete(`${API}/cart`,{headers:{Authorization:`Bearer ${token}`}});expect(cleared.ok()).toBeTruthy();
  await visit(`/products/${state.category_slug}/${state.product_slug}`);await expect(page.getByRole('heading',{name:state.product_name,exact:true})).toBeVisible();
  await page.getByLabel('Quantity',{exact:true}).first().fill('250');
  if(!await page.getByText('customer-artwork.png',{exact:true}).count())await page.getByLabel('Upload artwork file').setInputFiles('qa-pipeline/tutorials/order-lifecycle/assets/customer-artwork.png');
  await expect(page.getByText('customer-artwork.png',{exact:true}).first()).toBeVisible();
  const add=page.locator('button.w-full.h-12').filter({hasText:/Add to Cart|Update Cart/});await expect(add).toBeEnabled();await add.click();await expect(add).toContainText('Update Cart');
 };
 const checkout=async(review=false)=>{await visit('/checkout');await button('Continue to Payment').click();await expect(page.getByRole('button',{name:/Cash on Delivery/})).toBeVisible();if(review){const cod=page.getByRole('button',{name:/Cash on Delivery/});if(await cod.getAttribute('aria-disabled')!=='true')await cod.click();await button('Review Order').click();await expect(page.getByText('Confirming prices…')).toHaveCount(0);}};
 const cleanup=async()=>{
  await Promise.all(pending);
  const setting=kind==='cod-payments'?'cod':kind==='order-controls'?'halt':null;
  if(setting){const result=spawnSync('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/system-production/prepare.py','restore',setting],{encoding:'utf8'});if(result.status!==0)throw new Error('Setting restoration failed: '+result.stderr+' '+result.stdout);}
  writeFileSync(`qa-pipeline/artifacts/runs/${feature}-evidence.json`,JSON.stringify({kind,completed:state.completed?.includes(kind)??false,business_responses_mocked:false,original_setting_restored:setting?true:null,pricing_example_is_training_fixture:kind==='pricing-diagnostics',demo_only_forms_explicitly_disclosed:true,alert_delivery_not_claimed:true},null,2)+'\n');
 };
 return {page,state,save,step,type,read,admin,visit,choose,button,field,row,settingRow,saveSetting,customer,checkout,cleanup,headers:shared.headers,feature,settle};
}
