import {test} from '../capture.js';
import {runContentTutorial} from './content-tutorial.flows.js';
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,timezoneId:'Asia/Kolkata',captureOptions:{feature:"Content Banners",plan:'qa-pipeline/artifacts/plans/content-banners-plan.json',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',screenshotTimeout:60_000,persistEachStep:true}});
test('content-banners operator lifecycle',async({page,capture})=>{test.setTimeout(1_200_000);await runContentTutorial(page,capture,'banners');});
