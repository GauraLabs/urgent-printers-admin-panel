#!/usr/bin/env node
import { spawnSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, openSync, closeSync } from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const args=process.argv.slice(2), feature=args.find(a=>a.startsWith('--feature='))?.slice(10);
if(!['category-creation', 'product-lifecycle', 'order-lifecycle', 'content-banners', 'content-testimonials', 'content-announcements', 'content-faqs', 'content-navigation', 'content-theme', 'system-cod-payments', 'system-staff-notifications', 'system-order-controls', 'system-pricing-diagnostics', 'system-activity-log', 'system-staff', 'system-settings-overview', 'system-system-health', 'customer-management', 'customer-reviews'].includes(feature)) throw new Error('Invalid feature');
const common='qa-pipeline/tutorials/catalog-production', art='qa-pipeline/artifacts';
const run=`${art}/runs/${feature}-run.json`, shots=`${art}/shot-lists/${feature}-shotlist.json`, narration=`${art}/narration/${feature}-narration.json`;
const exec=(cmd,values)=>{const r=spawnSync(cmd,values,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);};
const featureArg=`--feature=${feature}`;
if(!args.includes('--archive-only')) exec('node',[`${common}/author.mjs`,featureArg]);
if(!args.includes('--reuse-capture')&&!args.includes('--archive-only')) {
 const previousRun=existsSync(resolve(root,run))?JSON.parse(readFileSync(resolve(root,run))):null;
 exec('node',[`${common}/assets.mjs`]);
 let owned;
 const status=async()=>{try{return await (await fetch('http://localhost:8020/__tutorial/status',{signal:AbortSignal.timeout(1500)})).json();}catch{return null;}};
 let current=await status();
 if(!current){
  const fd=openSync(join(homedir(),'.config/urgentprinters-tutorials/catalog-api.log'),'a',0o600);
  owned=spawn(resolve(root,'../urgent-printers-backend/.venv/bin/python'),[resolve(root,feature==='order-lifecycle'?'qa-pipeline/tutorials/order-lifecycle/dev-api.py':`${common}/dev-api.py`)],{cwd:resolve(root,'../urgent-printers-backend'),stdio:['ignore',fd,fd]});closeSync(fd);
  process.on('exit',()=>owned?.kill('SIGTERM'));
  for(let i=0;i<30&&!current;i++){await new Promise(r=>setTimeout(r,500));current=await status();}
 }
 if(!current?.tutorial||current.outbound_providers!=='fake'||current.task_broker!=='memory://')throw new Error('Isolated development API required');
 if(feature!=='order-lifecycle'&&!feature.startsWith('content-')&&!feature.startsWith('system-')&&!feature.startsWith('customer-'))exec(resolve(root,'../urgent-printers-backend/.venv/bin/python'),[`${common}/cleanup-owned.py`]);
 if(feature==='order-lifecycle')exec(resolve(root,'../urgent-printers-backend/.venv/bin/python'),['qa-pipeline/tutorials/order-lifecycle/prepare.py']);
 if(feature==='product-lifecycle')exec(resolve(root,'../urgent-printers-backend/.venv/bin/python'),[`${common}/prepare-customer.py`]);
 exec('npx',['playwright','test','--config=qa-pipeline/playwright/playwright.config.js',`${feature}.video.spec.js`]);
 owned?.kill('SIGTERM');
 const currentRun=JSON.parse(readFileSync(resolve(root,run))), editorial=JSON.parse(readFileSync(resolve(root,shots)));
 const routeKind=route=>route?.replace(/\/\d+(?=\/|$)/g,'/:id');
 editorial.reviewed_console_findings=(editorial.reviewed_console_findings??[]).flatMap(review=>{
  const before=previousRun?.steps.find(s=>s.step_id===review.step_id),after=currentRun.steps.find(s=>s.step_id===review.step_id);
  if(after&&!after.console_errors?.length)return [];
  if(!review.messages.some(m=>m.includes('ERR_NETWORK_CHANGED'))&&before&&after?.status==='pass'&&review.run_timestamp===previousRun.run_timestamp&&routeKind(before.route)===routeKind(after.route)&&after.console_errors.every(m=>review.messages.includes(m)))return [{...review,run_timestamp:currentRun.run_timestamp}];
  return [review];
 });
 writeFileSync(resolve(root,shots),JSON.stringify(editorial,null,2)+'\n');
}
if(args.includes('--capture-only')) process.exit(0);
for(const [kind,file] of [['plan',`${art}/plans/${feature}-plan.json`],['run',run],['shotlist',shots]])exec('node',['qa-pipeline/scripts/validate.mjs',kind,file,...(kind==='shotlist'?[`--run=${run}`]:[])]);
if(!args.includes('--archive-only')){
 exec('node',['qa-pipeline/scripts/synthesize-narration.mjs',`--narration=${narration}`,`--env-file=${join(homedir(),'.config/urgentprinters-tutorials/.env.local')}`]);
 exec('node',['qa-pipeline/scripts/validate.mjs','narration',narration,`--shotlist=${shots}`]);
 exec('node',[`${common}/subtitles.mjs`,featureArg]);
 if(args.includes('--audio-only'))process.exit(0);
 exec('node',[`${common}/resume-render.mjs`,featureArg,'--render-only',args.find(a=>a.startsWith('--gl='))??'--gl=vulkan',args.find(a=>a.startsWith('--concurrency='))??'--concurrency=2']);
 exec('node',[`${common}/normalize-audio.mjs`,featureArg]);
}
exec('node',[`${common}/verify.mjs`,featureArg,...(args.includes('--archive-only')?['--metadata-only']:[])]);
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),dest=resolve(root,art,'video/archives',feature,stamp);
mkdirSync(dest,{recursive:true});
for(const file of [run,`${art}/runs/${feature}-evidence.json`,shots,narration,`${art}/plans/${feature}-plan.json`,`${art}/screenshots/${feature}`,`${art}/narration/${feature}`,`${art}/video/sfx`,`${art}/video/renders/${feature}`,common,`qa-pipeline/tutorials/${feature}`,`${common}/dev-api.py`,'qa-pipeline/remotion','qa-pipeline/schemas','qa-pipeline/scripts/validate.mjs','qa-pipeline/scripts/render-video.mjs','qa-pipeline/scripts/synthesize-narration.mjs','qa-pipeline/playwright/capture.js','qa-pipeline/playwright/capture-reporter.js','qa-pipeline/playwright/playwright.config.js','qa-pipeline/playwright/specs/catalog-tutorial.helpers.js',`qa-pipeline/playwright/specs/${feature}.video.spec.js`,'qa-pipeline/playwright/fixtures/catalog-tutorial','package.json','package-lock.json','project.config.json','next.config.ts'])if(existsSync(resolve(root,file)))cpSync(resolve(root,file),join(dest,file),{recursive:true});
for(const file of ['app/services/product_service.py','app/services/product_cache.py','tests/unit/test_product_detail_visibility.py','tests/api/test_quantity_pricing.py'])cpSync(resolve(root,'../urgent-printers-backend',file),join(dest,'backend-fixes',file),{recursive:true});
const segments=`${art}/runs/${feature}-capture-segments`;
if(existsSync(resolve(root,segments)))cpSync(resolve(root,segments),join(dest,segments),{recursive:true});
if(feature.startsWith('content-')){
 const sources=['qa-pipeline/tutorials/content-production','qa-pipeline/playwright/specs/content-tutorial.helpers.js','qa-pipeline/playwright/specs/content-tutorial.flows.js','src/features/content/components/AnnouncementBar.tsx','src/lib/utils/istDate.ts'];
 for(const file of sources)cpSync(resolve(root,file),join(dest,file),{recursive:true});
 for(const file of ['lib/api/navLinks.ts','components/layout/Header.tsx','components/layout/MobileNavDrawer.tsx','components/layout/FooterLinkGroup.tsx','tests/nav-link-identity.test.tsx'])cpSync(resolve(root,'../urgent-printers-frontend',file),join(dest,'frontend-fixes',file),{recursive:true});
}
if(feature.startsWith('system-'))for(const file of ['qa-pipeline/tutorials/system-production','qa-pipeline/tutorials/content-production/assets.mjs','qa-pipeline/tutorials/content-production/assets','qa-pipeline/tutorials/content-production/assets/recovered-manifest.json','qa-pipeline/tutorials/order-lifecycle','src/features/staff/components/ActivityLogTable.tsx','src/features/staff/components/ActivityLogTable.test.tsx','qa-pipeline/playwright/specs/system-tutorial.helpers.js','qa-pipeline/playwright/specs/system-tutorial.flows.js','qa-pipeline/tutorials/order-lifecycle/assets/customer-artwork.png'])if(existsSync(resolve(root,file)))cpSync(resolve(root,file),join(dest,file),{recursive:true});
if(feature.startsWith('customer-'))for(const file of ['qa-pipeline/tutorials/customer-production','qa-pipeline/tutorials/order-lifecycle','qa-pipeline/playwright/specs/customer-tutorial.helpers.js','qa-pipeline/playwright/specs/customer-tutorial.flows.js','qa-pipeline/tutorials/content-production/assets','qa-pipeline/tutorials/content-production/assets.mjs'])if(existsSync(resolve(root,file)))cpSync(resolve(root,file),join(dest,file),{recursive:true});
writeFileSync(join(dest,'manifest.json'),JSON.stringify({feature,created_at:new Date().toISOString(),credentials_included:false,render_gl:args.find(a=>a.startsWith('--gl='))?.split('=')[1]??'vulkan',render_concurrency:Number(args.find(a=>a.startsWith('--concurrency='))?.split('=')[1]??2),resolutions:['1080p30','4K30'],sound_effects:true,source_run:JSON.parse(readFileSync(resolve(root,run))).run_timestamp},null,2)+'\n');
exec('tar',['-czf',dest+'.tar.gz','-C',dirname(dest),basename(dest)]);rmSync(dest,{recursive:true});console.log(`Full production archive: ${dest}.tar.gz`);
