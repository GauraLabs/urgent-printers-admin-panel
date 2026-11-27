// One-time audited migration: only multiline TypingOverlay changed. All other frames
// are byte-for-byte reusable after verifying the complete old input fingerprint.
import { readFileSync,readdirSync,mkdirSync,linkSync,existsSync,writeFileSync } from 'node:fs';
import { resolve,dirname,join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildTimeline } from '../../remotion/timeline.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const feature=process.argv.find(a=>a.startsWith('--feature='))?.slice(10),source=process.argv.find(a=>a.startsWith('--source='))?.slice(9);
if(!['category-creation','product-lifecycle'].includes(feature)||!source)throw new Error('Pass --feature and --source cache directory');
const read=p=>JSON.parse(readFileSync(resolve(root,p)));
const oldSource=readFileSync(resolve(root,'qa-pipeline/tutorials/catalog-production/history/FeatureDemo.before-multiline.txt'));
const newSource=readFileSync(resolve(root,'qa-pipeline/remotion/FeatureDemo.jsx'));
if(createHash('sha256').update(newSource).digest('hex')!=='ac43ce5026323e647fb45c30011a388ef97c6c47af822af81dafbc846d9e96cf')throw new Error('This one-time repair is restricted to the reviewed multiline fix');
const outsideTyping=s=>{s=s.toString();const start=s.indexOf('function TypingOverlay('),end=s.indexOf('function HighlightRing(',start);if(start<0||end<0)throw new Error('Missing component boundaries');return s.slice(0,start)+s.slice(end);};
if(outsideTyping(oldSource)!==outsideTyping(newSource))throw new Error('Changes outside TypingOverlay cannot use this repair');
const art='qa-pipeline/artifacts',run=read(`${art}/runs/${feature}-run.json`),shotlist=read(`${art}/shot-lists/${feature}-shotlist.json`),narration=read(`${art}/narration/${feature}-narration.json`),config=read('project.config.json');
const fps=30,width=3840,height=2160;
const timeline=buildTimeline(shotlist,run,fps,{narration,leadInMs:config.tts.lead_in_ms,tailMs:config.tts.tail_ms});
function fingerprint(prior){
 const hash=createHash('sha256').update(JSON.stringify({run,shotlist,narration,config,fps,width,height}));
 for(const name of readdirSync(resolve(root,'qa-pipeline/remotion')).sort())if(/\.(js|jsx)$/.test(name))hash.update(name==='FeatureDemo.jsx'&&prior?oldSource:readFileSync(resolve(root,'qa-pipeline/remotion',name)));
 for(const step of run.steps)for(const path of [step.screenshot_path,step.before_screenshot_path])if(path)hash.update(readFileSync(resolve(root,path)));
 for(const line of narration.lines)hash.update(readFileSync(resolve(root,line.audio_path)));
 return hash.digest('hex');
}
const oldFingerprint=fingerprint(true),newFingerprint=fingerprint(false);
const oldManifest=JSON.parse(readFileSync(join(source,'checkpoint.json')));
if(oldManifest.fingerprint!==oldFingerprint)throw new Error('Prior cache has different capture/audio/config/source; cannot safely reuse');
const cache=join(homedir(),'.cache/urgentprinters-tutorials',feature,newFingerprint.slice(0,16));mkdirSync(cache,{recursive:true});
const affected=timeline.shots.filter(s=>s.typedText&&s.box?.height>48),excluded=new Set(affected.flatMap(s=>Array.from({length:s.durationFrames},(_,i)=>s.from+i)));
let reused=0;
for(const name of readdirSync(source)){
 const match=/^element-(\d+)\.jpeg$/.exec(name);if(!match||excluded.has(Number(match[1])))continue;
 if(!existsSync(join(cache,name)))linkSync(join(source,name),join(cache,name));reused++;
}
writeFileSync(join(cache,'checkpoint.json'),JSON.stringify({fingerprint:newFingerprint,width,height,fps,total_frames:timeline.totalFrames},null,2)+'\n');
const report={feature,prior_fingerprint:oldFingerprint,new_fingerprint:newFingerprint,source_cache:source,cache,unchanged_frame_files_reused:reused,invalidated_steps:affected.map(s=>s.step_id),invalidated_frame_count:excluded.size,reason:'Only multiline typing font size/wrapping changed; exact previous complete-input hash verified; all frames of affected scenes invalidated.'};
writeFileSync(resolve(root,art,'video/renders',feature,'typing-repair.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
