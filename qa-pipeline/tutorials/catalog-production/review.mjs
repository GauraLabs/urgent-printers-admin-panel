// Export one actual rendered frame per scene for a quick visual review.
import sharp from 'sharp';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve,dirname,join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../../remotion/timeline.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const flag=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const feature=flag('feature'),cache=flag('cache');
if(!['category-creation', 'product-lifecycle', 'order-lifecycle', 'content-banners', 'content-testimonials', 'content-announcements', 'content-faqs', 'content-navigation', 'content-theme', 'system-cod-payments', 'system-staff-notifications', 'system-order-controls', 'system-pricing-diagnostics', 'system-activity-log', 'system-staff', 'system-settings-overview', 'system-system-health', 'customer-management', 'customer-reviews'].includes(feature)||!cache)throw new Error('Pass --feature and --cache');
const read=path=>JSON.parse(readFileSync(resolve(root,path)));
const art='qa-pipeline/artifacts';
const timeline=buildTimeline(read(`${art}/shot-lists/${feature}-shotlist.json`),read(`${art}/runs/${feature}-run.json`),30,{narration:read(`${art}/narration/${feature}-narration.json`)});
const frames=timeline.shots.map(s=>({step_id:s.step_id,frame:s.from+Math.floor(s.durationFrames*.72)}));
const composites=[],padding=String(timeline.totalFrames-1).length;
for(const [i,row] of frames.entries()){
 const left=i%4*480,top=Math.floor(i/4)*294;
 const input=await sharp(join(cache,`element-${String(row.frame).padStart(padding,'0')}.jpeg`)).resize(480,270).jpeg().toBuffer();
 composites.push({input,left,top});
 const label=Buffer.from(`<svg width="480" height="24"><text x="8" y="17" fill="white" font-family="sans-serif" font-size="13">${row.step_id} · frame ${row.frame}</text></svg>`);
 composites.push({input:label,left,top:top+270});
}
const out=resolve(root,art,'video/renders',feature);mkdirSync(out,{recursive:true});
await sharp({create:{width:1920,height:Math.ceil(frames.length/4)*294,channels:3,background:'#0f172a'}}).composite(composites).jpeg({quality:90}).toFile(join(out,'contact-sheet.jpg'));
writeFileSync(join(out,'review-frames.json'),JSON.stringify({fps:30,sample_position:.72,frames},null,2)+'\n');
console.log(`Visual review sheet: ${frames.length} actual rendered scenes`);
