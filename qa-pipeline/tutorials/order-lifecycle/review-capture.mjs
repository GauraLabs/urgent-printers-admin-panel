// Review actual composition frames without spending TTS credits or exporting a silent final movie.
import {bundle} from '@remotion/bundler';
import {renderFrames,selectComposition} from '@remotion/renderer';
import {cpSync,mkdtempSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {buildTimeline} from '../../remotion/timeline.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const read=path=>JSON.parse(readFileSync(resolve(root,path)));
const art='qa-pipeline/artifacts',feature='order-lifecycle';
const run=read(`${art}/runs/${feature}-run.json`),shotlist=read(`${art}/shot-lists/${feature}-shotlist.json`),config=read('project.config.json');
if(shotlist.shots.some(shot=>run.steps.find(step=>step.step_id===shot.step_id)?.status!=='pass'))throw new Error('Review requires a complete passed capture.');
const timeline=buildTimeline(shotlist,run,30,{narration:null});
const marks=[{step_id:'intro',frame:Math.floor(timeline.introFrames/2)},...timeline.shots.map(shot=>({step_id:shot.step_id,frame:shot.from+Math.floor(shot.durationFrames*.72)})),{step_id:'outro',frame:timeline.outroFrom+Math.floor(timeline.outroFrames/2)}];
const publicDir=mkdtempSync(join(tmpdir(),'order-review-public-'));
const out=resolve(root,art,'video/renders',feature,'visual-review');mkdirSync(out,{recursive:true});
let serveUrl;
try{
 cpSync(resolve(root,art,'screenshots',feature),join(publicDir,'screenshots',feature),{recursive:true});
 serveUrl=await bundle({entryPoint:resolve(root,'qa-pipeline/remotion/index.jsx'),publicDir});
 const props={run,shotlist,narration:null,brand:config.brand,fieldStyle:config.video_defaults.field_style,projectName:'Urgent Printers — Admin + Storefront',screenshotBase:'qa-pipeline/artifacts/',draft:true,soundEffects:false,fps:30,width:1920,height:1080};
 const composition=await selectComposition({serveUrl,id:'FeatureDemo',inputProps:props});
 await renderFrames({serveUrl,composition,inputProps:props,outputDir:out,frames:marks.map(mark=>mark.frame),imageFormat:'jpeg',jpegQuality:85,concurrency:2,timeoutInMilliseconds:120000,muted:true,chromiumOptions:{gl:'vulkan'},onFrameUpdate:count=>{if(count%10===0)console.log(`Reviewed frames ${count}/${marks.length}`);}});
 const files=readdirSync(out).filter(name=>/^element-\d+\.jpeg$/.test(name)).sort();
 const composites=[];
 for(const [index,mark] of marks.entries()){
  const file=files.find(name=>Number(name.match(/\d+/)[0])===mark.frame);if(!file)throw new Error(`Missing review frame ${mark.step_id}`);
  const left=index%4*480,top=Math.floor(index/4)*294;
  composites.push({input:await sharp(join(out,file)).resize(480,270).toBuffer(),left,top});
  composites.push({input:Buffer.from(`<svg width="480" height="24"><text x="8" y="17" fill="white" font-family="sans-serif" font-size="13">${mark.step_id} · visual draft · narration pending</text></svg>`),left,top:top+270});
 }
 await sharp({create:{width:1920,height:Math.ceil(marks.length/4)*294,channels:3,background:'#0f172a'}}).composite(composites).jpeg({quality:90}).toFile(join(out,'contact-sheet.jpg'));
 writeFileSync(join(out,'review.json'),JSON.stringify({kind:'visual-draft',narration_complete:false,source_run:run.run_timestamp,frames:marks},null,2)+'\n');
 console.log(join(out,'contact-sheet.jpg'));
}finally{rmSync(publicDir,{recursive:true,force:true});if(serveUrl?.startsWith(join(tmpdir(),'remotion-webpack-bundle-')))rmSync(serveUrl,{recursive:true,force:true});}
