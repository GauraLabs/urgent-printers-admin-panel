import {test} from '../capture.js';
import {runSystemTutorial} from './system-tutorial.flows.js';
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,timezoneId:'Asia/Kolkata',captureOptions:{feature:'system-activity-log',plan:'qa-pipeline/artifacts/plans/system-activity-log-plan.json',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',screenshotTimeout:60_000,persistEachStep:true}});
test('system-activity-log operator lifecycle',async({page,capture})=>{test.setTimeout(1200000);await runSystemTutorial(page,capture,'activity-log');});
