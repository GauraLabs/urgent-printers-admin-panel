import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
const args=process.argv.slice(2);
const only=args.find(arg=>arg.startsWith('--feature='))?.slice(10);
const requested=args.find(arg=>arg.startsWith('--features='))?.slice(11).split(',');
const features=['banners','testimonials','announcements','faqs','navigation','theme'].map(kind=>`content-${kind}`).filter(feature=>(!only||feature===only)&&(!requested||requested.includes(feature)));
if(!features.length)throw new Error('Unknown content tutorial');
const exec=(command,values)=>{const result=spawnSync(command,values,{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);};
if(!args.includes('--reuse-capture')){
 const status=await fetch('http://127.0.0.1:8000/__tutorial/status').then(response=>response.json());
 if(status.environment!=='development'||status.outbound_providers!=='fake')throw new Error('Isolated development read API required');
 exec('../urgent-printers-backend/.venv/bin/python',['qa-pipeline/tutorials/content-production/snapshot.py','snapshot']);
 exec('node',['qa-pipeline/tutorials/content-production/assets.mjs']);
 for(const feature of features)exec('node',['qa-pipeline/tutorials/catalog-production/build.mjs',`--feature=${feature}`,'--capture-only']);
}
if(args.includes('--capture-only'))process.exit(0);
for(const feature of features){
 exec('node',['qa-pipeline/tutorials/catalog-production/build.mjs',`--feature=${feature}`,'--reuse-capture',...args.filter(arg=>arg.startsWith('--gl=')||arg.startsWith('--concurrency=')||arg==='--audio-only')]);
 if(args.includes('--audio-only'))continue;
 const report=JSON.parse(readFileSync(`qa-pipeline/artifacts/video/renders/${feature}/quality-report.json`));
 if(report.videos.length!==2||report.videos.some(video=>!video.full_decode_verified_at))throw new Error('Both verified exports are required');
 // Keep finished movies, raw plates, narration, scripts and archives. Only
 // regenerable frame intermediates are pruned to leave room for the next lesson.
 const receipt=JSON.parse(readFileSync(`qa-pipeline/artifacts/video/renders/${feature}/render-receipt.json`));
 if(!receipt.cache.includes(`/urgentprinters-tutorials/${feature}/`))throw new Error('Unexpected frame cache');
 if(existsSync(receipt.cache))for(const name of readdirSync(receipt.cache))if(/^element-\d+\.jpeg$/.test(name)||name==='full-mix.wav')unlinkSync(join(receipt.cache,name));
 console.log(`${feature}: verified movies and editable production archive retained; intermediate frames pruned.`);
}
