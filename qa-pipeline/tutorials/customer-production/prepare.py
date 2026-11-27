"""Reuse only the owned tutorial buyer/delivered order and guard every restoration."""
import asyncio,json,runpy,sys
from pathlib import Path
from sqlalchemy import select,delete,update
ROOT=Path(__file__).resolve().parents[3]
runpy.run_path(str(ROOT/'qa-pipeline/tutorials/catalog-production/dev-api.py'))
from app.core.database import AsyncSessionFactory,engine
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.models.review import Review
folder=Path.home()/'.config/urgentprinters-tutorials';path=folder/'customer-tutorial-session.json'
def save(state):path.write_text(json.dumps(state,indent=2)+'\n');path.chmod(0o600)
async def refresh(db,product):
 from app.core.redis import RedisClient,get_redis_client
 from app.services.product_cache import invalidate_product_caches,revalidate_storefront
 from app.providers.frontend_revalidation.factory import get_frontend_revalidation_provider
 raw=get_redis_client()
 try:
  from app.services.category_tree import CATEGORY_CACHE_KEY
  await raw.delete(CATEGORY_CACHE_KEY)
  await invalidate_product_caches(RedisClient(raw),[product.slug]);await revalidate_storefront(get_frontend_revalidation_provider(),db,[product],revalidate_all=True)
 finally:await raw.aclose()
async def main():
 command=sys.argv[1] if len(sys.argv)>1 else 'prepare'
 async with AsyncSessionFactory() as db:
  if command=='prepare':
   if path.exists() and not json.loads(path.read_text()).get('restored',False):print('Unfinished customer fixture retained');return
   previous=json.loads((folder/'order-lifecycle-session.json').read_text());assert previous.get('owned_demo')
   order=await db.get(Order,int(previous['order_id']));assert order and order.status=='delivered'
   buyer=await db.get(User,order.user_id);assert buyer.email==previous['email']
   product=await db.get(Product,int(previous['product_id']));category=await db.get(Category,int(previous['category_id']))
   reviews=(await db.execute(select(Review).where(Review.product_id==product.id,Review.user_id==buyer.id))).scalars().all();assert not reviews,'Owned buyer already has a review; preserve it and provision a separate fixture'
   product_reviews=(await db.execute(select(Review).where(Review.product_id==product.id).order_by(Review.id))).scalars().all()
   s={k:previous[k] for k in ['email','password','product_id','product_name','product_slug','category_id','category_slug','order_id','order_number']}
   s.update(product_id=product.id,category_id=category.id,order_id=order.id,customer_id=buyer.id,customer_name=(buyer.first_name+' '+buyer.last_name).strip(),originals={'user':buyer.model_dump(mode='json'),'product':product.model_dump(mode='json'),'category':category.model_dump(mode='json'),'product_reviews':[r.model_dump(mode='json') for r in product_reviews]},owned_review_ids=[],restored=False,completed=[])
   product.status='active';category.is_active=True;db.add(product);db.add(category);await db.commit();save(s);await refresh(db,product);print('Owned buyer and genuinely delivered tutorial order ready')
  elif command=='restore':
   s=json.loads(path.read_text());buyer=await db.get(User,s['customer_id']);product=await db.get(Product,s['product_id']);category=await db.get(Category,s['category_id'])
   original_user=User.model_validate(s['originals']['user']);original_product=Product.model_validate(s['originals']['product']);original_category=Category.model_validate(s['originals']['category'])
   assert buyer.model_dump(mode='json',exclude={'is_active','is_banned','updated_at'})==original_user.model_dump(mode='json',exclude={'is_active','is_banned','updated_at'}),'Customer changed outside recording'
   if s.get('last_customer_status'):assert buyer.is_banned==(s['last_customer_status']=='banned') and buyer.is_active==(s['last_customer_status']=='active'),'Concurrent customer status change'
   else:assert (buyer.is_active,buyer.is_banned)==(original_user.is_active,original_user.is_banned),'Untracked customer status change'
   assert product.model_dump(mode='json',exclude={'status','is_active','rating','review_count','updated_at'})==original_product.model_dump(mode='json',exclude={'status','is_active','rating','review_count','updated_at'}),'Product changed outside recording'
   assert category.model_dump(mode='json',exclude={'is_active','updated_at'})==original_category.model_dump(mode='json',exclude={'is_active','updated_at'}),'Category changed outside recording'
   assert product.status=='active' and product.is_active,'Unexpected product visibility change'
   assert category.is_active,'Unexpected category visibility change'
   current_reviews=(await db.execute(select(Review).where(Review.product_id==product.id).order_by(Review.id))).scalars().all()
   originals=s['originals']['product_reviews'];old_ids={r['id'] for r in originals}
   for review in current_reviews:
    if review.id in old_ids:
     assert review.model_dump(mode='json')==next(r for r in originals if r['id']==review.id),'Original review changed outside recording'
    else:
     assert review.id in s['owned_review_ids'] and review.user_id==buyer.id,'Unexpected review; restoration stopped'
     await db.delete(review)
   assert {r.id for r in current_reviews if r.id in old_ids}==old_ids
   await db.execute(update(User).where(User.id==buyer.id).values(is_active=original_user.is_active,is_banned=original_user.is_banned,updated_at=original_user.updated_at))
   await db.execute(update(Product).where(Product.id==product.id).values(status=original_product.status,is_active=original_product.is_active,rating=original_product.rating,review_count=original_product.review_count,updated_at=original_product.updated_at))
   await db.execute(update(Category).where(Category.id==category.id).values(is_active=original_category.is_active,updated_at=original_category.updated_at))
   await db.commit();s['restored']=True;save(s);await refresh(db,original_product);print('Original buyer, catalogue and ratings restored; only owned review removed')
 await engine.dispose()
asyncio.run(main())
