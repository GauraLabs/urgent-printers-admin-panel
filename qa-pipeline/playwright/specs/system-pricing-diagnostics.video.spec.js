import {test} from '../capture.js';
import {runSystemTutorial} from './system-tutorial.flows.js';
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,timezoneId:'Asia/Kolkata',captureOptions:{feature:'system-pricing-diagnostics',plan:'qa-pipeline/artifacts/plans/system-pricing-diagnostics-plan.json',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',screenshotTimeout:60_000,persistEachStep:true}});
test('system-pricing-diagnostics operator lifecycle',async({page,capture})=>{test.setTimeout(1200000);await runSystemTutorial(page,capture,'pricing-diagnostics');});
