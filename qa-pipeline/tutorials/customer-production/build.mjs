import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
const args=process.argv.slice(2),only=args.find(a=>a.startsWith('--feature='))?.slice(10);
const features=['customer-management','customer-reviews'].filter(f=>!only||f===only);if(!features.length)throw new Error('Unknown customer lesson');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{stdio:'inherit'});if(r.status!==0)throw new Error(`${cmd} exited ${r.status}`);};
if(!args.includes('--reuse-capture')){
 const status=await fetch('http://127.0.0.1:8000/__tutorial/status').then(r=>r.json());if(status.environment!=='development'||status.outbound_providers!=='fake')throw new Error('Isolated development API required');
 run('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/customer-production/prepare.py','prepare']);
 try{run('node',['qa-pipeline/tutorials/content-production/assets.mjs']);for(const feature of features)run('node',['qa-pipeline/tutorials/catalog-production/build.mjs',`--feature=${feature}`,'--capture-only']);}
 finally{run('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/customer-production/prepare.py','restore']);}
}
if(args.includes('--capture-only'))process.exit(0);
for(const feature of features){
 run('node',['qa-pipeline/tutorials/catalog-production/build.mjs',`--feature=${feature}`,'--reuse-capture',...args.filter(a=>a.startsWith('--gl=')||a.startsWith('--concurrency=')||a==='--audio-only')]);
 if(args.includes('--audio-only'))continue;
 const report=JSON.parse(readFileSync(`qa-pipeline/artifacts/video/renders/${feature}/quality-report.json`));if(report.videos.length!==2||report.videos.some(v=>!v.full_decode_verified_at))throw new Error('Verified exports required');
 const receipt=JSON.parse(readFileSync(`qa-pipeline/artifacts/video/renders/${feature}/render-receipt.json`));if(!receipt.cache.includes(`/urgentprinters-tutorials/${feature}/`))throw new Error('Unexpected frame cache');
 if(existsSync(receipt.cache))for(const name of readdirSync(receipt.cache))if(/^element-\d+\.jpeg$/.test(name)||name==='full-mix.wav')unlinkSync(join(receipt.cache,name));
}
