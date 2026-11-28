import {test} from '../capture.js';
import {runCustomerTutorial} from './customer-tutorial.flows.js';
test.use({viewport:{width:1600,height:900},deviceScaleFactor:4,timezoneId:'Asia/Kolkata',captureOptions:{feature:'customer-management',plan:'qa-pipeline/artifacts/plans/customer-management-plan.json',axe:'off',lighthouse:'off',preActionScreenshots:true,screenshotCaret:'initial',screenshotTimeout:60000,persistEachStep:true}});
test('customer-management operator lifecycle',async({page,capture})=>{test.setTimeout(1200000);await runCustomerTutorial(page,capture,'customer-management');});
