import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
const args=process.argv.slice(2),only=args.find(a=>a.startsWith('--feature='))?.slice(10),requested=args.find(a=>a.startsWith('--features='))?.slice(11).split(',');
const kinds=['staff','staff-notifications','activity-log','settings-overview','order-controls','cod-payments','system-health','pricing-diagnostics'];
const features=kinds.map(k=>'system-'+k).filter(f=>(!only||f===only)&&(!requested||requested.includes(f)));
if(!features.length)throw new Error('Unknown system lesson');
const exec=(cmd,args)=>{const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);};
if(!args.includes('--reuse-capture')){
 const status=await fetch('http://127.0.0.1:8000/__tutorial/status').then(r=>r.json());if(status.environment!=='development'||status.outbound_providers!=='fake')throw new Error('Isolated development API required');
 exec('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/system-production/prepare.py','prepare']);
 exec('node',['qa-pipeline/tutorials/content-production/assets.mjs']);
 for(const feature of features)exec('node',['qa-pipeline/tutorials/catalog-production/build.mjs',`--feature=${feature}`,'--capture-only']);
 if(!only&&!requested)exec('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/system-production/prepare.py','restore','all']);
}
if(args.includes('--capture-only'))process.exit(0);
for(const feature of features){
 exec('node',['qa-pipeline/tutorials/catalog-production/build.mjs',`--feature=${feature}`,'--reuse-capture',...args.filter(a=>a.startsWith('--gl=')||a.startsWith('--concurrency=')||a==='--audio-only')]);
 if(args.includes('--audio-only'))continue;
 const report=JSON.parse(readFileSync(`qa-pipeline/artifacts/video/renders/${feature}/quality-report.json`));if(report.videos.length!==2||report.videos.some(v=>!v.full_decode_verified_at))throw new Error('Verified exports required');
 const receipt=JSON.parse(readFileSync(`qa-pipeline/artifacts/video/renders/${feature}/render-receipt.json`));if(!receipt.cache.includes(`/urgentprinters-tutorials/${feature}/`))throw new Error('Unexpected frame cache');
 if(existsSync(receipt.cache))for(const name of readdirSync(receipt.cache))if(/^element-\d+\.jpeg$/.test(name)||name==='full-mix.wav')unlinkSync(join(receipt.cache,name));
 console.log(feature+': verified exports and archive retained; intermediate frames pruned');
}
