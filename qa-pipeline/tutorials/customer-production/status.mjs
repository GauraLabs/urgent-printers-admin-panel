import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
const read=p=>existsSync(p)?JSON.parse(readFileSync(p)):null;
const lessons=['customer-management','customer-reviews'].map(feature=>{
 const content=read(`qa-pipeline/tutorials/${feature}/content.json`),run=read(`qa-pipeline/artifacts/runs/${feature}-run.json`),narration=read(`qa-pipeline/artifacts/narration/${feature}-narration.json`),report=read(`qa-pipeline/artifacts/video/renders/${feature}/quality-report.json`);
 const expected=[{step_id:'intro',text:content.intro},...content.steps.map(s=>({step_id:s.id,text:s.text})),{step_id:'outro',text:content.outro}];
 const pending=expected.filter(l=>!narration?.lines.some(a=>a.step_id===l.step_id&&a.text===l.text&&a.duration_ms&&a.audio_path&&existsSync(a.audio_path)));
 return {feature,title:content.title,planned_steps:content.steps.length,captured_steps:run?.steps.filter(s=>s.status==='pass').length??0,all_steps_passed:run?.steps.length===content.steps.length&&run.steps.every(s=>s.status==='pass'),console_errors:run?.steps.flatMap(s=>s.console_errors??[])??[],narration_lines_ready:expected.length-pending.length,narration_lines_required:expected.length,pending_characters:pending.reduce((n,l)=>n+Array.from(l.text).length,0),verified_video_files:report?.videos.filter(v=>v.full_decode_verified_at&&existsSync(v.path)).length??0};
});
const output='qa-pipeline/artifacts/video/renders/customer-training';mkdirSync(output,{recursive:true});const complete=lessons.every(l=>l.all_steps_passed&&!l.console_errors.length&&l.verified_video_files===2&&l.narration_lines_ready===l.narration_lines_required);
writeFileSync(`${output}/production-status.json`,JSON.stringify({updated_at:new Date().toISOString(),lessons,complete},null,2)+'\n');
if(!complete)writeFileSync(`${output}/narration-pending.json`,JSON.stringify({reason:'ElevenLabs quota_exceeded',pending_clips:lessons.reduce((n,l)=>n+l.narration_lines_required-l.narration_lines_ready,0),pending_characters:lessons.reduce((n,l)=>n+l.pending_characters,0),resume_commands:['node qa-pipeline/tutorials/customer-production/narrate.mjs','node qa-pipeline/tutorials/customer-production/build.mjs --reuse-capture --gl=vulkan --concurrency=2','node qa-pipeline/tutorials/customer-production/collection.mjs']},null,2)+'\n');
console.log(JSON.stringify(lessons,null,2));
