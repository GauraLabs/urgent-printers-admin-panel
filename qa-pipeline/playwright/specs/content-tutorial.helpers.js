import {expect as baseExpect} from '../capture.js';
import {setup,ADMIN,SHOP,API,folder} from './catalog-tutorial.helpers.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
export const expect=baseExpect.configure({timeout:30_000});
export {ADMIN,SHOP,API};
export async function contentContext(page,capture,kind){
 const feature=`content-${kind}`,statePath=join(folder,`${feature}-session.json`);
 const state={kind,created_ids:[]};
 const save=()=>writeFileSync(statePath,JSON.stringify(state,null,2)+'\n',{mode:0o600});save();
 const content=JSON.parse(readFileSync(`qa-pipeline/tutorials/${feature}/content.json`));
 const shared=await setup(page,capture,feature);
 const pending=[];
 page.on('response',response=>{
  const request=response.request(),url=new URL(response.url());
  if(!response.ok()||!['POST','PATCH','PUT'].includes(request.method())||!url.pathname.startsWith('/api/v1/admin/'))return;
  const promise=(async()=>{
   if(url.pathname.endsWith('/reorder'))return;
   if(!/\/(content\/(banners|testimonials|faqs|announcement|nav-links)(\/\d+)?|theme)$/.test(url.pathname))return;
   const row=(await response.json()).data;if(!row)return;
   if(request.method()==='POST'&&row.id)state.created_ids=[...new Set([...state.created_ids,Number(row.id)])];
   if(['announcements','theme'].includes(kind)&&row.updated_at)state.last_saved_updated_at=row.updated_at;
   save();
  })();pending.push(promise);
 });
 await page.context().route(/https:\/\/([^/]+\.)?(google-analytics\.com|clarity\.ms)\//,route=>route.fulfill({status:204,body:''}));
 await page.context().route('**/*',route=>{
  const request=route.request(),url=new URL(request.url());
  if(request.resourceType()==='document'&&url.hostname==='localhost'&&url.port==='3000')return route.continue({headers:{...request.headers(),'cache-control':'no-cache'}});
  return route.fallback();
 });
 await page.addInitScript(()=>{if(location.port==='3000')localStorage.setItem('cookie-consent','accepted');});
 const read=async(path,admin=false)=>{const response=await page.request.get(`${API}${admin?'/admin':''}${path}`,{headers:admin?shared.headers:{}});expect(response.ok()).toBeTruthy();const data=(await response.json()).data;return admin&&Array.isArray(data)?{items:data}:data;};
 const step=async(number,target,fn=async()=>{})=>{
  const item=content.steps[number-1];
  const wide=target?await target.boundingBox().catch(()=>null):null;
  if(wide?.width>1000||/^(Add|Open|Create|Save|Publish|Delete|Confirm|Hide|Restore|Schedule|Turn on)/.test(item.title)){
   const path=`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`,shots=JSON.parse(readFileSync(path));shots.shots.find(s=>s.step_id===item.id).emphasis='pause';writeFileSync(path,JSON.stringify(shots,null,2)+'\n');
  }
  await shared.step(item.id,target,fn);await Promise.all(pending);
 };
 const type=async(number,target,text)=>{
  const box=await target.boundingBox();if(box?.width>1000){const path=`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`,shots=JSON.parse(readFileSync(path));shots.shots.find(s=>s.step_id===content.steps[number-1].id).emphasis='pause';writeFileSync(path,JSON.stringify(shots,null,2)+'\n');}
  await shared.type(content.steps[number-1].id,target,text);
 };
 const input=name=>page.locator(`form [name="${name}"]`);
 const icon=(row,name)=>row.getByRole('button').filter({has:page.locator(`svg[class*="lucide-${name}"]`)});
 const card=label=>kind==='banners'||kind==='navigation'?page.getByRole('listitem').filter({has:page.getByText(label,{exact:true})}):page.getByText(label,{exact:true}).first().locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
 const visit=async(path='/')=>{await page.goto(SHOP+path);await page.waitForLoadState('domcontentloaded');};
 const admin=async()=>{await page.goto(`${ADMIN}/content/${kind}`);await expect(page.getByRole('heading',{level:1})).toBeVisible();};
 const saveButton=label=>page.getByRole('button',{name:label,exact:true});
 const chooseLink=async(name)=>{await page.locator('form').getByRole('combobox').first().click();await page.getByRole('option',{name,exact:true}).click();};
 const cleanup=async()=>{
  await Promise.all(pending);
  const result=spawnSync('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/content-production/snapshot.py','restore',kind],{encoding:'utf8'});
  if(result.status!==0)throw new Error(`Original content restore failed: ${result.stderr}\n${result.stdout}`);
  writeFileSync(`qa-pipeline/artifacts/runs/${feature}-evidence.json`,JSON.stringify({kind,created_ids:state.created_ids,completed:state.completed??false,original_content_restored:true,business_responses_mocked:false,outbound_providers:'fake',intended_audience:'website operators'},null,2)+'\n');
 };
 return {page,state,save,step,type,input,icon,card,read,visit,admin,saveButton,chooseLink,cleanup,headers:shared.headers,feature};
}
