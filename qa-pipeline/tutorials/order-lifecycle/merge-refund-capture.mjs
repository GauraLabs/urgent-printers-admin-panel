// Join a verified refund pickup to the same delivered order; never fabricate passed steps.
import {cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
const art='qa-pipeline/artifacts',segments=`${art}/runs/order-lifecycle-capture-segments`;
const read=path=>JSON.parse(readFileSync(path));
const before=read(`${segments}/checkout-through-cancellation.json`),after=read(`${art}/runs/order-lifecycle-refund-run.json`);
const state=read(join(homedir(),'.config/urgentprinters-tutorials/order-lifecycle-session.json'));
const first=before.steps.slice(0,55),last=after.steps;
const expected=read('qa-pipeline/tutorials/order-lifecycle/content.json').steps.map(step=>step.id);
if(!state.completed||first.length!==55||last.length!==6)throw new Error('Incomplete capture segments');
if([...first,...last].some((step,index)=>step.status!=='pass'||step.step_id!==expected[index]))throw new Error('Every planned step must actually pass in order.');
for(const [step,route] of [[first[12],`/orders/${state.order_id}`],[first[52],`/orders/${state.refund_order_id}`],[last[5],`/orders/${state.order_id}`]])if(step.route!==route)throw new Error('Segments belong to different orders');
if(JSON.stringify(before.viewport)!==JSON.stringify(after.viewport))throw new Error('Capture dimensions changed');
mkdirSync(`${art}/screenshots/order-lifecycle`,{recursive:true});
const offset=first.at(-1).timestamp_ms+1000;
const combined=last.map(step=>{
 const row={...step,timestamp_ms:offset+step.timestamp_ms};
 for(const field of ['screenshot_path','before_screenshot_path'])if(row[field]){
  const target=row[field].replace('/order-lifecycle-refund/','/order-lifecycle/');cpSync(row[field],target);row[field]=target;
 }
 return row;
});
cpSync(`${art}/runs/order-lifecycle-refund-run.json`,`${segments}/refund-resumed.json`);
writeFileSync(`${art}/runs/order-lifecycle-run.json`,JSON.stringify({...before,trace_path:null,steps:[...first,...combined]},null,2)+'\n');
writeFileSync(`${segments}/manifest.json`,JSON.stringify({same_order_ids_verified:true,main_order_id:state.order_id,refund_order_id:state.refund_order_id,first_segment_timestamp:before.run_timestamp,refund_segment_timestamp:after.run_timestamp,first_segment_passed_steps:55,resumed_passed_steps:6,reason:'Recording selector or-56 matched both a heading and button. Corrected selector and resumed from the unchanged cancelled, paid fixture.',private_browser_traces_excluded:true},null,2)+'\n');
console.log('61 passed steps joined from two verified captures of the same orders.');
