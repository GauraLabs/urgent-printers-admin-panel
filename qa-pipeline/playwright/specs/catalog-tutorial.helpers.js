import { expect } from '../capture.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
export const ADMIN='http://localhost:3001', SHOP='http://localhost:3000', API='http://localhost:8020/api/v1';
export const folder=join(homedir(),'.config/urgentprinters-tutorials');
export const statePath=join(folder,'catalog-session.json');
export const save=state=>writeFileSync(statePath,JSON.stringify(state,null,2)+'\n',{mode:0o600});
export const load=()=>existsSync(statePath)?JSON.parse(readFileSync(statePath)):{};
export async function setup(page,capture,feature){
 const content=JSON.parse(readFileSync(`qa-pipeline/tutorials/${feature}/content.json`));
 await page.context().route('**/api/v1/**',async route=>{
  const url=new URL(route.request().url());
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return route.abort('blockedbyclient');
  url.hostname='localhost';url.port='8020';return route.continue({url:url.href});
 });
 // FakeStorage writes real processed variants locally. Serve those exact bytes,
 // including Next image requests, without substituting API data or placeholder art.
 const localMediaHosts=new Set(['cdn.urgentprinters.com','pub-cdbb44b55dd3441cbce165e75299a30d.r2.dev']);
 await page.context().route(/cdn\.urgentprinters\.com\/|pub-cdbb44b55dd3441cbce165e75299a30d\.r2\.dev\/|\/_next\/image\?/,async route=>{
  const req=new URL(route.request().url());
  const src=req.pathname==='/_next/image'?new URL(req.searchParams.get('url'),req.origin):req;
  const path=resolve('/tmp/fake_uploads',decodeURIComponent(src.pathname).replace(/^\/+/,''));
  if(localMediaHosts.has(src.hostname)&&path.startsWith('/tmp/fake_uploads'+sep)&&existsSync(path))return route.fulfill({status:200,contentType:path.endsWith('.png')?'image/png':path.endsWith('.pdf')?'application/pdf':path.endsWith('.jpg')?'image/jpeg':'image/webp',body:readFileSync(path)});
  return route.continue();
 });
 await page.addInitScript(()=>{
  const inject=()=>{if(!document.head||document.getElementById('tutorial-style'))return;const s=document.createElement('style');s.id='tutorial-style';s.textContent='nextjs-portal,[data-sonner-toaster]{display:none!important} main{padding-bottom:200px!important} input,textarea,[contenteditable]{caret-color:transparent!important}';document.head.append(s);};
  new MutationObserver(inject).observe(document,{childList:true,subtree:true});inject();
 });
 await page.goto(`${ADMIN}/login`);
 await page.locator('#email').fill(process.env.QA_ADMIN_EMAIL??'admin@urgentprinters.com');
 await page.locator('#password').fill(process.env.QA_ADMIN_PASSWORD ?? (() => { throw new Error("Set QA_ADMIN_PASSWORD before recording tutorials"); })());
 const response=page.waitForResponse(r=>r.url().includes('/admin/auth/login')&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Sign in'}).click();
 const login=await response;expect(login.ok(),`Admin login failed (HTTP ${login.status()})`).toBeTruthy();
 const body=await login.json();expect(typeof (body.data??body).access_token).toBe('string');const headers={Authorization:`Bearer ${(body.data??body).access_token}`};
 await page.waitForURL('**/dashboard',{timeout:60_000});
 const step=async(id,target,fn=async()=>{})=>{const s=content.steps.find(s=>s.id===id);if(!s)throw new Error(`Unknown step ${id}`);await capture.step(id,s.title,target,fn);console.log(`✓ ${id}: ${s.title}`);};
 const type=async(id,target,value)=>{await target.scrollIntoViewIfNeeded();await capture.type(id,content.steps.find(s=>s.id===id).title,target,value);console.log(`✓ ${id}: typed`);};
 return {headers,step,type};
}
export async function publicCategory(page,slug){const r=await page.request.get(`${API}/categories`);expect(r.ok()).toBeTruthy();const b=await r.json();return (Array.isArray(b.data)?b.data:b.data?.items??b.items??[]).find(c=>c.slug===slug);}
