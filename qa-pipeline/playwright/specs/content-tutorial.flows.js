import {contentContext,expect,SHOP} from './content-tutorial.helpers.js';
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
const assets='qa-pipeline/tutorials/content-production/assets';
const label={banners:'Elegant Wedding Invitations',testimonials:'Meera Kapoor',faqs:'How do I prepare artwork for my invitation order?'};
const original=()=>JSON.parse(readFileSync(join(homedir(),'.config/urgentprinters-tutorials/content-originals.json')));
const date=days=>new Date(Date.now()+days*86400000).toISOString().slice(0,10);
async function open(c,name,field){await c.icon(c.card(name),'pencil').click();await c.input(field).scrollIntoViewIfNeeded();}
async function saved(c,name){await c.saveButton(name).click();await expect(c.page.locator('form')).toHaveCount(0);}
async function shown(c,title){
 await c.visit();const rows=await c.read('/content/banners'),id=c.state.created_ids[0],index=rows.findIndex(row=>row.id===id);expect(index).toBeGreaterThanOrEqual(0);
 const dot=c.page.getByRole('button',{name:`Go to slide ${index+1}`,exact:true});if(await dot.count())await dot.click();
 const slide=c.page.locator('.swiper-slide-active');await expect(slide.getByRole('heading',{name:title,exact:true})).toBeVisible();await slide.getByRole('heading',{name:title,exact:true}).hover();
 await expect.poll(async()=>slide.locator('img').first().evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);
}
async function hiddenBanner(c,title){await c.visit();await expect(c.page.getByRole('heading',{name:title,exact:true})).toHaveCount(0);expect((await c.read('/content/banners')).some(row=>row.id===c.state.created_ids[0])).toBe(false);}
async function banners(c){
 const {page,step:S,type:T,input:I,admin,saveButton:B,card:C,icon,chooseLink}=c;let title=label.banners;
 await S(1,null,admin);await S(2,B('Add Banner'),async el=>{await el.click();await I('title').scrollIntoViewIfNeeded();});
 await T(3,I('title'),title);await T(4,I('subtitle'),'Explore beautiful paper and finish options.');await T(5,I('badge_text'),'New Collection');
 await S(6,page.locator('form input[type=file]'),async el=>{await el.setInputFiles(`${assets}/invitation-banner.png`);await expect(I('image_url')).not.toHaveValue('');});
 await S(7,page.getByRole('img',{name:'Preview',exact:true}),async el=>{await expect.poll(()=>el.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);});
 await S(8,page.locator('form').getByRole('combobox'),async()=>chooseLink('All Products'));await T(9,I('link_text'),'Explore Collection');
 await S(10,I('valid_from'),async()=>{await expect(I('valid_from')).toHaveValue('');await expect(I('valid_until')).toHaveValue('');});
 await S(11,page.locator('form').getByRole('switch'),async el=>{await el.click();await expect(el).not.toBeChecked();});await S(12,B('Create Banner'),async()=>saved(c,'Create Banner'));
 await S(13,null,async()=>hiddenBanner(c,title));await admin();await S(14,icon(C(title),'pencil'),async()=>open(c,title,'title'));
 await S(15,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save Changes');});
 await S(16,icon(C(title),'arrow-up'),async()=>{
  for(let n=0;n<10;n++){const rows=(await c.read('/content/banners?page_size=100',true)).items;if(Number(rows[0].id)===c.state.created_ids[0])break;
   const response=page.waitForResponse(r=>r.url().endsWith('/admin/content/banners/reorder')&&r.request().method()==='POST');await icon(C(title),'arrow-up').click();expect((await response).ok()).toBeTruthy();}
  expect(Number((await c.read('/content/banners?page_size=100',true)).items[0].id)).toBe(c.state.created_ids[0]);
 });
 await S(17,null,async()=>shown(c,title));await S(18,page.locator('.swiper-slide-active').getByRole('link',{name:'Explore Collection',exact:true}),async el=>{await el.click();await page.waitForURL(`${SHOP}/products`);await expect(page.getByRole('heading',{level:1})).toBeVisible();});
 await admin();await open(c,title,'title');title='Wedding Invitations, Beautifully Printed';await T(19,I('title'),title);await S(20,B('Save Changes'),async()=>{await saved(c,'Save Changes');await shown(c,title);});
 await admin();await open(c,title,'title');await S(21,I('valid_from'),async()=>{await I('valid_from').fill(date(2));await I('valid_until').fill(date(4));await saved(c,'Save Changes');});await S(22,null,async()=>hiddenBanner(c,title));
 await admin();await open(c,title,'title');await S(23,I('valid_until'),async()=>{await I('valid_from').fill(date(-4));await I('valid_until').fill(date(-2));await saved(c,'Save Changes');await hiddenBanner(c,title);});
 await admin();await open(c,title,'title');await S(24,I('valid_from'),async()=>{await I('valid_from').fill('');await I('valid_until').fill('');await saved(c,'Save Changes');await shown(c,title);});
 await admin();await open(c,title,'title');await S(25,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save Changes');});await S(26,null,async()=>hiddenBanner(c,title));
 await admin();await S(27,icon(C(title),'trash'),async el=>{await el.click();await expect(page.getByRole('dialog')).toBeVisible();});await S(28,page.getByRole('dialog').getByRole('button',{name:'Delete Banner',exact:true}),async el=>{await el.click();await expect(C(title)).toHaveCount(0);await hiddenBanner(c,title);});
}
async function testimonials(c){
 const {page,step:S,type:T,input:I,admin,saveButton:B,card:C,icon}=c,name=label.testimonials;const quote='The invitation colours were clear and the paper felt lovely.';const updated='The invitation colours were clear, and the finished cards looked lovely.';
 const settle=async()=>{
  const section=page.locator('section[aria-labelledby="testimonials-heading"]');await section.scrollIntoViewIfNeeded();
  await expect.poll(()=>section.locator('article').evaluateAll(cards=>cards.length>0&&cards.every(card=>Number(getComputedStyle(card).opacity)>.99))).toBe(true);
  await expect.poll(()=>page.locator('#testimonials-heading').evaluate(heading=>{for(let node=heading;node;node=node.parentElement)if(Number(getComputedStyle(node).opacity)<.99)return false;return true;})).toBe(true);
 };
 const show=async text=>{await c.visit();const section=page.locator('section[aria-labelledby="testimonials-heading"]');await section.scrollIntoViewIfNeeded();await expect(section.getByText(name,{exact:true})).toBeVisible();await expect(section.getByText(text,{exact:false})).toBeVisible();await settle();};
 const hide=async()=>{await c.visit();await page.locator('section[aria-labelledby="testimonials-heading"]').scrollIntoViewIfNeeded();await expect(page.getByText(name,{exact:true})).toHaveCount(0);await settle();};
 await S(1,null,admin);await S(2,B('Add Testimonial'),async el=>{await el.click();await I('customer_name').scrollIntoViewIfNeeded();});await T(3,I('customer_name'),name);await T(4,I('customer_title'),'Design Studio');
 await S(5,page.locator('form input[type=file]'),async el=>{await el.setInputFiles(`${assets}/customer-avatar.png`);await expect(I('avatar_url')).not.toHaveValue('');await expect.poll(()=>page.getByRole('img',{name:'Avatar preview'}).evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);});
 await T(6,I('content'),quote);await S(7,page.locator('form button').filter({has:page.locator('svg.lucide-star')}).nth(3),async el=>{await el.click();});await S(8,page.locator('form').getByRole('switch'),async el=>{await el.click();});await S(9,B('Create'),async()=>saved(c,'Create'));await S(10,null,hide);
 await admin();await S(11,icon(C(name),'pencil'),async()=>open(c,name,'customer_name'));await S(12,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save');});await S(13,null,async()=>{await show(quote);const row=(await c.read('/content/testimonials')).find(r=>r.id===c.state.created_ids[0]);expect(row.rating).toBe(4);});
 await admin();await open(c,name,'customer_name');await T(14,I('content'),updated);await S(15,B('Save'),async()=>{await saved(c,'Save');await show(updated);});
 await admin();await open(c,name,'customer_name');await S(16,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save');});await S(17,null,hide);
 await admin();await open(c,name,'customer_name');await S(18,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save');await show(updated);});
 await admin();await S(19,icon(C(name),'trash'),async el=>{await el.click();await expect(page.getByRole('dialog')).toBeVisible();});await S(20,page.getByRole('dialog').getByRole('button',{name:'Delete',exact:true}),async el=>{await el.click();await expect(C(name)).toHaveCount(0);await hide();});
}
async function faqs(c){
 const {page,step:S,type:T,input:I,admin,saveButton:B,icon}=c,q=label.faqs,second='Where can I check my invitation artwork proof?';
 const answer='Check the artwork guidelines before uploading your print file.';const updated='Check the artwork guidelines, then review size and spelling before approving your proof.';
 const row=question=>page.getByRole('button',{name:question,exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
 const show=async()=>{await c.visit('/faq');await page.getByRole('button',{name:q,exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:q,exact:true})).toBeVisible();};
 const hide=async()=>{await c.visit('/faq');await expect(page.getByRole('button',{name:q,exact:true})).toHaveCount(0);};
 const edit=async()=>{await icon(row(q),'pencil').click();await I('question').scrollIntoViewIfNeeded();};
 await S(1,null,admin);await S(2,B('Add FAQ'),async el=>{await el.click();await I('question').scrollIntoViewIfNeeded();});await T(3,I('question'),q);await T(4,I('category'),'Invitation Orders');await T(5,I('answer'),answer);
 await S(6,page.locator('form').getByRole('switch'),async el=>{await el.click();});await S(7,B('Create'),async()=>saved(c,'Create'));await S(8,null,hide);await admin();await S(9,icon(row(q),'pencil'),edit);
 await S(10,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save');});await S(11,null,show);await S(12,page.getByRole('button',{name:q,exact:true}),async el=>{await el.click();await expect(page.getByText(answer,{exact:true})).toBeVisible();});
 await admin();await edit();await T(13,I('answer'),updated);await S(14,B('Save'),async()=>{await saved(c,'Save');await show();await page.getByRole('button',{name:q,exact:true}).click();await expect(page.getByText(updated,{exact:true})).toBeVisible();});
 await admin();await S(15,B('Add FAQ'),async el=>{await el.click();await I('question').fill(second);await I('category').fill('Invitation Orders');await I('answer').fill('Open My Orders and select the order to review the available proof.');await saved(c,'Create');});
 await S(16,icon(row(second),'arrow-up'),async el=>{const r=page.waitForResponse(r=>r.url().endsWith('/admin/content/faqs/reorder')&&r.request().method()==='POST');await el.click();expect((await r).ok()).toBeTruthy();});
 await S(17,null,async()=>{await c.visit('/faq');const order=await page.getByRole('button').allTextContents();expect(order.indexOf(second)).toBeLessThan(order.indexOf(q));await page.getByRole('button',{name:second,exact:true}).scrollIntoViewIfNeeded();});
 await admin();await edit();await S(18,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save');});await S(19,null,hide);
 await admin();await edit();await S(20,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save');await show();});
 await admin();await S(21,icon(row(q),'trash'),async el=>{await el.click();await expect(page.getByRole('dialog')).toBeVisible();});await S(22,page.getByRole('dialog').getByRole('button',{name:'Delete FAQ',exact:true}),async el=>{await el.click();await expect(row(q)).toHaveCount(0);await hide();});
}
async function announcements(c){
 const {page,step:S,type:T,input:I,admin,saveButton:B,chooseLink}=c;
 const normal='Discover our new invitation collection';const timed='Explore the invitation collection before';
 const save=async()=>{const r=page.waitForResponse(r=>r.url().endsWith('/admin/content/announcement')&&r.request().method()==='PUT');await B('Save Announcement').click();expect((await r).ok()).toBeTruthy();await expect(B('Save Announcement')).not.toBeDisabled();};
 const switchBar=()=>page.locator('form').getByRole('switch');
 const show=async text=>{await c.visit();await expect(page.locator('p.truncate').filter({hasText:text})).toBeVisible();};
 await S(1,null,admin);await T(2,I('message'),normal);await S(3,page.locator('form').getByRole('combobox'),async()=>chooseLink('All Products'));await T(4,I('link_text'),'Explore Collection');
 await T(5,page.getByPlaceholder('#3b82f6',{exact:true}),'#173e38');await T(6,page.getByPlaceholder('#ffffff',{exact:true}),'#ffffff');await S(7,page.getByText('Preview',{exact:true}),async()=>{await expect(page.getByText(normal,{exact:false}).first()).toBeVisible();});
 await S(8,switchBar(),async el=>{if(!await el.isChecked())await el.click();});await S(9,B('Save Announcement'),save);await S(10,null,async()=>show(normal));
 await S(11,page.locator('p.truncate').getByRole('link',{name:'Explore Collection',exact:true}),async el=>{await el.click();await page.waitForURL(`${SHOP}/products`);});
 await admin();await T(12,I('message'),timed);await S(13,B('Insert {{timer}}'),async el=>{await el.click();await expect(I('message')).toHaveValue(`${timed} {{timer}}`);});
 const deadline=`${date(2)}T18:30`;await S(14,I('countdown_end_at'),async el=>{await el.fill(deadline);await expect(el).toHaveValue(deadline);});
 await S(15,B('Save Announcement'),async()=>{await save();await expect(I('countdown_end_at')).toHaveValue(deadline);await show(timed);await expect(page.locator('p.truncate').filter({hasText:timed})).toContainText(/\d+d?\s*[:h]/);});
 await S(16,null,async()=>{await admin();await expect(I('countdown_end_at')).toHaveValue(deadline);});
 await S(17,I('countdown_end_at'),async el=>{await el.fill(`${date(-2)}T18:30`);await save();await expect(page.getByText(/its countdown deadline has passed/)).toBeVisible();await c.visit();await expect(page.locator('p.truncate').filter({hasText:timed})).toHaveCount(0);});
 await admin();await S(18,I('message'),async el=>{await el.fill(normal);await I('countdown_end_at').fill('');await save();await show(normal);});
 await admin();await S(19,switchBar(),async el=>{await el.click();await save();});await S(20,null,async()=>{await c.visit();await expect(page.locator('p.truncate').filter({hasText:normal})).toHaveCount(0);});
 await admin();await S(21,switchBar(),async el=>{await el.click();await save();await show(normal);});
}
async function navigation(c){
 const {page,step:S,type:T,input:I,admin,saveButton:B,card:C,icon}=c;let title='Shop Cards';
 const category=(await c.read('/categories')).find(row=>row.slug==='business-cards');expect(category).toBeTruthy();
 const create=async()=>saved(c,'Create Link');const edit=async()=>open(c,title,'label');
 await S(1,null,admin);await S(2,page.getByRole('tab',{name:'Header',exact:true}),async el=>{await el.click();});await S(3,B('Add Link'),async el=>{await el.click();await I('label').scrollIntoViewIfNeeded();});await T(4,I('label'),title);
 await S(5,page.getByRole('combobox',{name:'Target category'}),async el=>{await el.click();await page.getByRole('option',{name:category.name,exact:true}).click();});await S(6,B('Create Link'),create);
 await S(7,null,async()=>{await c.visit();await expect(page.locator('header').getByRole('link',{name:title,exact:true})).toBeVisible();});await S(8,page.locator('header').getByRole('link',{name:title,exact:true}),async el=>{await el.click();await page.waitForURL(`${SHOP}/products/${category.slug}`);await expect(page.getByRole('heading',{name:category.name,exact:true,level:1})).toBeVisible();await expect(page.getByText('No products found',{exact:true})).toHaveCount(0);});
 await admin();await S(9,icon(C(title),'pencil'),edit);title='Browse Business Cards';await T(10,I('label'),title);await S(11,B('Save Changes'),async()=>{await saved(c,'Save Changes');await c.visit();await expect(page.locator('header').getByRole('link',{name:title,exact:true})).toBeVisible();});
 await admin();await S(12,B('Add Link'),async el=>{await el.click();await I('label').scrollIntoViewIfNeeded();});await T(13,I('label'),'Artwork Help');await S(14,B('Custom URL'),async el=>{await el.click();await page.getByPlaceholder('https://example.com or /products/business-cards',{exact:true}).fill('/policies/artwork-guidelines');});await S(15,B('Create Link'),create);
 await S(16,icon(C('Artwork Help'),'arrow-up'),async el=>{const response=page.waitForResponse(r=>r.url().endsWith('/admin/content/nav-links/reorder')&&r.request().method()==='POST');await el.click();expect((await response).ok()).toBeTruthy();});
 await S(17,null,async()=>{await c.visit();const el=page.locator('header').getByRole('link',{name:'Artwork Help',exact:true});await el.click();await page.waitForURL(`${SHOP}/policies/artwork-guidelines`);await expect(page.getByRole('heading',{level:1})).toBeVisible();});
 await admin();await S(18,page.getByRole('tab',{name:'Footer',exact:true}),async el=>{await el.click();});await S(19,B('Add Link'),async el=>{await el.click();await I('label').fill('Order Help');});await S(20,B('Custom URL'),async el=>{await el.click();await page.getByPlaceholder('https://example.com or /products/business-cards',{exact:true}).fill('/faq');});await S(21,B('Create Link'),create);
 await S(22,null,async()=>{await c.visit();await page.locator('footer').getByRole('link',{name:'Order Help',exact:true}).scrollIntoViewIfNeeded();await expect(page.locator('footer').getByRole('link',{name:'Order Help',exact:true})).toBeVisible();});await S(23,page.locator('footer').getByRole('link',{name:'Order Help',exact:true}),async el=>{await el.click();await page.waitForURL(`${SHOP}/faq`);await expect(page.getByRole('heading',{name:'Frequently Asked Questions',exact:true})).toBeVisible();});
 await admin();await edit();await S(24,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save Changes');});await S(25,null,async()=>{await c.visit();await expect(page.locator('header').getByRole('link',{name:title,exact:true})).toHaveCount(0);});
 await admin();await edit();await S(26,page.locator('form').getByRole('switch'),async el=>{await el.click();await saved(c,'Save Changes');await c.visit();await expect(page.locator('header').getByRole('link',{name:title,exact:true})).toBeVisible();});
 await admin();await S(27,icon(C(title),'trash'),async el=>{await el.click();await expect(page.getByRole('dialog')).toBeVisible();});await S(28,page.getByRole('dialog').getByRole('button',{name:'Delete Link',exact:true}),async el=>{await el.click();await expect(C(title)).toHaveCount(0);await c.visit();await expect(page.locator('header').getByRole('link',{name:title,exact:true})).toHaveCount(0);});
}
async function theme(c){
 const {page,step:S,admin,saveButton:B}=c;const initial=original().tables.theme[0]?.preset_id??'roseGold';const names={roseGold:'Rose Gold',gold:'Royal Gold',emerald:'Emerald Heritage',slate:'Slate Luxury',pink:'Blush Pink',plum:'Orchid Plum'};
 const check=async(id,path='/')=>{await c.visit(path);if(id==='roseGold')await expect(page.locator('html')).not.toHaveClass(/theme-(gold|emerald|slate|pink|plum)/);else await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${id}`));expect((await c.read('/content/theme')).preset_id).toBe(id);};
 const save=async()=>{const response=page.waitForResponse(r=>r.url().endsWith('/admin/theme')&&r.request().method()==='PUT');await B('Save Theme').click();expect((await response).ok()).toBeTruthy();await expect(B('Save Theme')).toBeDisabled();};
 await S(1,null,admin);await S(2,page.getByText('Brand color preset',{exact:true}),async()=>{await expect(B('Royal Gold')).toBeVisible();await expect(B('Emerald Heritage')).toBeVisible();});
 // Make the first published choice differ from the original so Save is meaningful.
 if(initial==='gold'){await B('Rose Gold').click();await save();}
 await S(3,B('Royal Gold'),async el=>{await el.click();await expect(el).toHaveAttribute('aria-pressed','true');});await S(4,B('Save Theme'),save);await S(5,null,async()=>check('gold'));await S(6,null,async()=>check('gold','/products'));
 await admin();await S(7,B('Emerald Heritage'),async el=>{await el.click();});await S(8,B('Save Theme'),save);await S(9,null,async()=>check('emerald'));
 await admin();await S(10,B(names[initial]),async el=>{await el.click();await save();});await S(11,null,async()=>check(initial));
}
const flows={banners,testimonials,faqs,announcements,navigation,theme};
export async function runContentTutorial(page,capture,kind){const context=await contentContext(page,capture,kind);try{await flows[kind](context);context.state.completed=true;context.save();}finally{await context.cleanup();}}
