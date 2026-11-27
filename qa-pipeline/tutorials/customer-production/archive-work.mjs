// Preserve an explicitly incomplete production without claiming missing videos are finished.
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const run=(cmd,args,options={})=>{const r=spawnSync(cmd,args,{stdio:'inherit',...options});if(r.status!==0)throw new Error(cmd+' failed');return r;};
run('node',['qa-pipeline/tutorials/customer-production/status.mjs']);
const status=JSON.parse(readFileSync('qa-pipeline/artifacts/video/renders/customer-training/production-status.json'));
if(status.lessons.some(l=>!l.all_steps_passed||l.console_errors.length))throw new Error('All clean captures required');
const files=['qa-pipeline/tutorials/customer-production','qa-pipeline/tutorials/catalog-production','qa-pipeline/tutorials/order-lifecycle','qa-pipeline/tutorials/content-production/assets.mjs','qa-pipeline/tutorials/content-production/assets','qa-pipeline/remotion','qa-pipeline/schemas','qa-pipeline/scripts/validate.mjs','qa-pipeline/scripts/render-video.mjs','qa-pipeline/scripts/synthesize-narration.mjs','qa-pipeline/playwright/capture.js','qa-pipeline/playwright/capture-reporter.js','qa-pipeline/playwright/playwright.config.js','qa-pipeline/playwright/specs/catalog-tutorial.helpers.js','qa-pipeline/playwright/specs/customer-tutorial.helpers.js','qa-pipeline/playwright/specs/customer-tutorial.flows.js','src/features/customers','src/features/reviews','src/lib/api/customers.ts','src/lib/api/reviews.ts','package.json','package-lock.json','project.config.json','next.config.ts','qa-pipeline/artifacts/video/sfx','qa-pipeline/artifacts/video/renders/customer-training'];
for(const {feature} of status.lessons)files.push(`qa-pipeline/tutorials/${feature}`,`qa-pipeline/playwright/specs/${feature}.video.spec.js`,`qa-pipeline/artifacts/plans/${feature}-plan.json`,`qa-pipeline/artifacts/runs/${feature}-run.json`,`qa-pipeline/artifacts/runs/${feature}-evidence.json`,`qa-pipeline/artifacts/shot-lists/${feature}-shotlist.json`,`qa-pipeline/artifacts/screenshots/${feature}`,`qa-pipeline/artifacts/narration/${feature}-narration.json`,`qa-pipeline/artifacts/narration/${feature}`,`qa-pipeline/artifacts/video/renders/${feature}`);
const dir='qa-pipeline/artifacts/video/archives/customer-training-work';mkdirSync(dir,{recursive:true});
const archive=join(dir,new Date().toISOString().replace(/[:.]/g,'-')+'.tar.gz');
const list=join(tmpdir(),'customer-training-source-files.txt');writeFileSync(list,files.filter(existsSync).join('\n')+'\n');
run('tar',['-czf',archive,'--exclude=__pycache__','--exclude=*.pyc','-T',list]);
const digest=createHash('sha256').update(readFileSync(archive)).digest('hex');writeFileSync(archive+'.sha256',digest+'  '+archive.split('/').at(-1)+'\n');
console.log(resolve(archive));
