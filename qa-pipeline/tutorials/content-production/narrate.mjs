import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {join} from 'node:path';
for(const kind of ['banners','testimonials','announcements','faqs','navigation','theme']){
 const result=spawnSync('node',['qa-pipeline/scripts/synthesize-narration.mjs',`--narration=qa-pipeline/artifacts/narration/content-${kind}-narration.json`,`--env-file=${join(homedir(),'.config/urgentprinters-tutorials/.env.local')}`],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status??1);
}
