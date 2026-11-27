"""Explicit simulated prepaid fixture; no charge, booking, or notification emitted."""
import asyncio,json,runpy,secrets
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('dev-api.py')))
from app.core.config import settings
from app.core.database import AsyncSessionFactory,engine
from app.models.order import Order,OrderItem,OrderStatusHistory
from sqlalchemy import select
assert settings.app_env=='development' and settings.payment_provider=='fake'
path=Path.home()/'.config/urgentprinters-tutorials/order-lifecycle-session.json'
async def main():
    state=json.loads(path.read_text())
    async with AsyncSessionFactory() as db:
        original=await db.get(Order,int(state['order_id']));assert original.user_id==state['customer_id']
        suffix=secrets.token_hex(4)
        fields=['user_id','shipping_address','billing_address','subtotal','shipping_cost','discount_amount','gst_rate','gst_amount','total_amount']
        order=Order(**{k:getattr(original,k) for k in fields},order_number=f'UP-DEMO-REFUND-{suffix.upper()}',status='placed',payment_method='razorpay',payment_status='paid',razorpay_payment_id=f'fake_pay_tutorial_{suffix}',notes='Simulated prepaid tutorial fixture; no money captured')
        db.add(order);await db.flush()
        items=(await db.execute(select(OrderItem).where(OrderItem.order_id==original.id))).scalars().all()
        for item in items:
            values=item.model_dump(exclude={'id','order_id'});db.add(OrderItem(**values,order_id=order.id))
        db.add(OrderStatusHistory(order_id=order.id,status='placed',note='Simulated prepaid development fixture; no money captured',created_by='system'))
        await db.commit();state.update(refund_order_id=order.id,refund_order_number=order.order_number)
    path.write_text(json.dumps(state,indent=2)+'\n');path.chmod(0o600);await engine.dispose();print('Simulated prepaid refund fixture prepared.')
asyncio.run(main())
