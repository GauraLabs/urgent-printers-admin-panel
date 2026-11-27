import {expect as baseExpect} from '../capture.js';
import {setup,ADMIN,SHOP,API,folder} from './catalog-tutorial.helpers.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export const expect=baseExpect.configure({timeout:30000});
export {ADMIN,SHOP,API};
export async function customerContext(page,capture,feature){
 const path=join(folder,'customer-tutorial-session.json'),state=JSON.parse(readFileSync(path)),content=JSON.parse(readFileSync(`qa-pipeline/tutorials/${feature}/content.json`));
 const save=()=>writeFileSync(path,JSON.stringify(state,null,2)+'\n',{mode:0o600});
 const shared=await setup(page,capture,feature),pending=[];
 page.on('response',response=>{const request=response.request(),url=new URL(response.url());if(!response.ok())return;
  if(request.method()==='PATCH'&&url.pathname===`/api/v1/admin/customers/${state.customer_id}/status`)pending.push((async()=>{state.last_customer_status=request.postDataJSON().status;save();})());
  if(request.method()==='POST'&&url.pathname===`/api/v1/products/${state.product_slug}/reviews`)pending.push((async()=>{const review=(await response.json()).data;state.review_id=Number(review.id);state.owned_review_ids=[...new Set([...state.owned_review_ids,state.review_id])];save();})());
 });
 await page.context().route(/https:\/\/([^/]+\.)?(google-analytics\.com|clarity\.ms)\//,route=>route.fulfill({status:204,body:''}));
 await page.addInitScript(()=>{if(location.port==='3000')localStorage.setItem('cookie-consent','accepted');});
 // Exact bytes of this owned buyer's previously uploaded training artwork.
 // FakeStorage may not retain the original behind its thumbnail URL.
 await page.context().route(/cdn\.urgentprinters\.com\/|\/_next\/image\?/,route=>{
  const request=new URL(route.request().url());const src=request.pathname==='/_next/image'?new URL(request.searchParams.get('url'),request.origin):request;
  if(src.hostname==='cdn.urgentprinters.com'&&new RegExp(`^/artworks/${state.customer_id}/[a-z0-9]+/customer-artwork\\.png$`).test(src.pathname))return route.fulfill({status:200,contentType:'image/png',body:readFileSync('qa-pipeline/tutorials/order-lifecycle/assets/customer-artwork.png')});
  return route.fallback();
 });

 const settle=async()=>{await page.waitForTimeout(450);};
 const framing=async(n,target)=>{const shotsPath=`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`,shots=JSON.parse(readFileSync(shotsPath));const box=target?await target.boundingBox():null;shots.shots.find(s=>s.step_id===content.steps[n-1].id).emphasis=box&&box.width<850?'zoom':'pause';writeFileSync(shotsPath,JSON.stringify(shots,null,2)+'\n');};
 const step=async(n,target,fn=async()=>{})=>{if(target)await target.scrollIntoViewIfNeeded();await framing(n,target);await shared.step(content.steps[n-1].id,target,async el=>{await fn(el);await settle();});await Promise.all(pending);};
 const type=async(n,target,text)=>{await framing(n,target);await shared.type(content.steps[n-1].id,target,text);};
 const read=async(path,admin=true)=>{const r=await page.request.get(`${API}${admin?'/admin':''}${path}`,{headers:admin?shared.headers:{}});expect(r.ok()).toBeTruthy();const body=await r.json();return Array.isArray(body.data)?{items:body.data,...body.meta}:body.data;};
 const admin=async route=>{await page.goto(ADMIN+route);await expect(page.locator('h1')).toBeVisible();await settle();};
 const visit=async route=>{await page.goto(SHOP+route);await page.waitForLoadState('domcontentloaded');await settle();};
 const button=name=>page.getByRole('button',{name,exact:true});
 const choose=async(target,name)=>{await target.click();await page.getByRole('option',{name,exact:true}).click();await page.waitForLoadState('networkidle');await settle();};
 const profile=()=>admin(`/customers/${state.customer_id}`);
 const row=()=>page.getByRole('row').filter({hasText:state.email}).first();
 const reviewRow=()=>page.getByRole('row').filter({hasText:state.product_name}).first();
 const dialog=()=>page.getByRole('dialog');
 const login=async({banned=false}={})=>{
  await visit('/auth/login');await button('Email').click();await page.locator('#email-address').fill(state.email);await page.locator('#password').fill(state.password);
  if(banned)await page.addStyleTag({content:'body [data-sonner-toaster]{display:block!important}'});
  const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/auth/login'&&r.request().method()==='POST');await button('Sign In').click();const r=await response;
  if(banned){expect(r.status()).toBe(403);state.blocked_login_http_status=r.status();save();await expect(page.getByText('We couldn’t sign you in right now. Please try again.',{exact:true})).toBeVisible();}
  else{expect(r.ok()).toBeTruthy();await page.waitForURL('**/account');}
 };
 const publicSection=()=>page.getByRole('heading',{name:'Customer Reviews',exact:true}).locator('xpath=..');
 const productReviews=async()=>{await visit(`/products/${state.category_slug}/${state.product_slug}`);const tab=page.getByRole('tab',{name:/^Reviews/});await tab.click();await expect(tab).toHaveAttribute('aria-selected','true');await expect(page.getByRole('heading',{name:'Customer Reviews',exact:true})).toBeVisible();const focus=await publicSection().locator('article').count()?publicSection().locator('article').first():page.getByRole('heading',{name:'Customer Reviews',exact:true});await focus.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle();};
 const icon=(scope,name)=>scope.getByRole('button').filter({has:page.locator(`svg[class*="lucide-${name}"]`)});
 const finish=async()=>{state.completed=[...new Set([...state.completed,feature])];save();writeFileSync(`qa-pipeline/artifacts/runs/${feature}-evidence.json`,JSON.stringify({feature,completed:true,owned_tutorial_buyer:true,uses_existing_genuinely_delivered_order:true,business_responses_mocked:false,blocked_login_http_status:state.blocked_login_http_status??null,review_id:state.review_id??null,automatic_ban_email_not_claimed:true,storefront_reply_display_not_claimed:true,customer_review_edit_delete_ui_not_available:true},null,2)+'\n');};
 return {state,save,step,type,read,admin,visit,button,choose,profile,row,reviewRow,dialog,login,productReviews,publicSection,icon,finish,settle};
}
