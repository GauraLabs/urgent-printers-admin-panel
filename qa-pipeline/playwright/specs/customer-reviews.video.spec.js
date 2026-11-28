import {test} from '../capture.js';
import {runCustomerTutorial} from './customer-tutorial.flows.js';
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,timezoneId:'Asia/Kolkata',captureOptions:{feature:'customer-reviews',plan:'qa-pipeline/artifacts/plans/customer-reviews-plan.json',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',screenshotTimeout:60000,persistEachStep:true}});
test('customer-reviews operator lifecycle',async({page,capture})=>{test.setTimeout(1200000);await runCustomerTutorial(page,capture,'customer-reviews');});
