"""Owned development fixtures and guarded restoration; no production state."""
import asyncio,json,runpy,secrets,sys
from pathlib import Path
from sqlalchemy import select,delete,update
ROOT=Path(__file__).resolve().parents[3]
runpy.run_path(str(ROOT/'qa-pipeline/tutorials/catalog-production/dev-api.py'))
from app.core.database import AsyncSessionFactory,engine
from app.core.security import hash_password
from app.models.admin_user import AdminUser,AdminRole
from app.models.cod_setting import CodSetting
from app.models.order_halt import OrderHaltSetting
from app.models.staff_notification_preference import StaffNotificationPreference
from app.models.price_mismatch_event import PriceMismatchEvent
from app.models.product import Product
folder=Path.home()/'.config/urgentprinters-tutorials';path=folder/'system-session.json'
def save(state):path.write_text(json.dumps(state,indent=2)+'\n');path.chmod(0o600)
async def refresh_product(db,product):
 from app.core.redis import RedisClient,get_redis_client
 from app.services.product_cache import invalidate_product_caches,revalidate_storefront
 from app.providers.frontend_revalidation.factory import get_frontend_revalidation_provider
 raw=get_redis_client()
 try:
  await invalidate_product_caches(RedisClient(raw),[product.slug])
  await revalidate_storefront(get_frontend_revalidation_provider(),db,[product])
 finally:await raw.aclose()
async def main():
 command=sys.argv[1] if len(sys.argv)>1 else 'prepare'
 async with AsyncSessionFactory() as db:
  if command=='prepare':
   if path.exists() and not json.loads(path.read_text()).get('restored',False):print('Unfinished owned fixture retained');return
   order=json.loads((folder/'order-lifecycle-session.json').read_text())
   state={'created_staff_ids':[],'originals':{},'email':order['email'],'password':order['password'],'product_id':order['product_id'],'product_name':order['product_name'],'category_slug':order['category_slug'],'product_slug':order['product_slug'],'staff_password':secrets.token_urlsafe(24),'restored':False}
   for name,model in [('cod',CodSetting),('halt',OrderHaltSetting)]:
    state['originals'][name]=[r.model_dump(mode='json') for r in (await db.execute(select(model).order_by(model.id))).scalars().all()]
   product=await db.get(Product,state['product_id']);state['product_original']=product.model_dump(mode='json');product.status='active';db.add(product)
   for key,name,role,phone in [('contact_staff','Training Operations',AdminRole.operations_manager,'+919876500199'),('no_phone_staff','Training Support',AdminRole.customer_support,None)]:
    member=AdminUser(name=name,email=key+'-'+secrets.token_hex(4)+'@example.com',hashed_password=hash_password(state['staff_password']),role=role,phone_number=phone,is_active=True)
    db.add(member);await db.flush();state[key]=member.id;state['created_staff_ids'].append(member.id)
   example=PriceMismatchEvent(stage='preview',product_slug='operator-training-price-check',quantity=100,client_unit=10,server_unit=12,client_total=1000,server_total=1200,diff_total=-200,likely_cause='unexplained',options={'paper':'Training example'},context={'request_id':'operator-training-example','user_agent':'Operator training example; no customer incident'},note=None)
   db.add(example);await db.flush();state['mismatch_id']=example.id
   await db.commit();save(state);await refresh_product(db,product);print('Owned system fixtures prepared outside repositories')
  elif command=='restore':
   state=json.loads(path.read_text());kind=sys.argv[2]
   if kind in ['cod','halt']:
    model={'cod':CodSetting,'halt':OrderHaltSetting}[kind]
    rows=(await db.execute(select(model).order_by(model.id))).scalars().all(); originals=state['originals'][kind]
    expected=state.get('last_saved',{}).get(kind)
    if expected and rows and rows[0].updated_at.isoformat()!=expected.replace('Z','+00:00'):raise RuntimeError('Concurrent setting change; restore stopped')
    if not expected and [r.model_dump(mode='json') for r in rows]!=originals:raise RuntimeError('Untracked setting change; restore stopped')
    ids=[r['id'] for r in originals]
    for row in rows:
     if row.id not in ids:await db.delete(row)
    for row in originals:await db.execute(update(model).where(model.id==row['id']).values(**model.model_validate(row).model_dump()))
    await db.commit();state.setdefault('restored_settings',[]).append(kind);state.setdefault('last_saved',{}).pop(kind,None);save(state)
    from app.providers.frontend_revalidation.factory import get_frontend_revalidation_provider
    halted=state['originals']['halt'][0]['is_halted'] if state['originals']['halt'] else False
    await get_frontend_revalidation_provider().revalidate_order_halt(halted)
   elif kind=='all':
    for name,model in [('cod',CodSetting),('halt',OrderHaltSetting)]:
     current=[r.model_dump(mode='json') for r in (await db.execute(select(model).order_by(model.id))).scalars().all()]
     assert current==state['originals'][name],name+' was not restored'
    await db.execute(delete(StaffNotificationPreference).where(StaffNotificationPreference.admin_user_id.in_(state['created_staff_ids'])))
    await db.execute(delete(PriceMismatchEvent).where(PriceMismatchEvent.id==state['mismatch_id']))
    # Audit history is retained. Nullable actor foreign keys are managed by the database.
    await db.execute(delete(AdminUser).where(AdminUser.id.in_(state['created_staff_ids'])))
    original=Product.model_validate(state['product_original']);current=await db.get(Product,original.id)
    assert current is not None
    assert current.model_dump(mode='json',exclude={'status','is_active','updated_at'})==original.model_dump(mode='json',exclude={'status','is_active','updated_at'}),'Product changed outside recording; restore stopped'
    assert current.status in ['active',original.status],'Product status changed outside recording'
    await db.execute(update(Product).where(Product.id==original.id).values(status=original.status,is_active=original.is_active,updated_at=original.updated_at))
    await db.commit();state['restored']=True;save(state);await refresh_product(db,original);print('Original settings/product restored; only owned system fixtures removed')
 await engine.dispose()
asyncio.run(main())
