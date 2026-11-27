import {rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {join} from 'node:path';
export const kinds=['staff','staff-notifications','activity-log','settings-overview','order-controls','cod-payments','system-health','pricing-diagnostics'];
for(const kind of kinds){
 const feature=`system-${kind}`;
 for(const [script,args] of [['qa-pipeline/tutorials/catalog-production/author.mjs',[`--feature=${feature}`]],['qa-pipeline/scripts/synthesize-narration.mjs',[`--narration=qa-pipeline/artifacts/narration/${feature}-narration.json`,`--env-file=${join(homedir(),'.config/urgentprinters-tutorials/.env.local')}`]]]){
  const r=spawnSync('node',[script,...args],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);
 }
}

rmSync('qa-pipeline/artifacts/video/renders/system-training/narration-pending.json',{force:true});
