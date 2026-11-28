"""Prepare owned development customer/catalogue; no real outbound providers."""
import os
import runpy
from pathlib import Path
import httpx,json
previous_path = Path.home()/'.config/urgentprinters-tutorials/order-lifecycle-session.json'
if previous_path.exists():
    previous = json.loads(previous_path.read_text())
    if previous.get('owned_demo') and previous.get('product_id'):
        with httpx.Client(base_url='http://127.0.0.1:8020/api/v1',timeout=30) as client:
            status=client.get('http://127.0.0.1:8020/__tutorial/status').json()
            assert status['environment']=='development' and status['outbound_providers']=='fake' and status['task_broker']=='memory://'
            r=client.post('/admin/auth/login',json={'email':'admin@urgentprinters.com','password':os.environ["QA_ADMIN_PASSWORD"]});r.raise_for_status();client.headers['Authorization']='Bearer '+r.json()['data']['access_token']
            p=client.get(f"/admin/products/{previous['product_id']}").json()['data']
            assert p['name']==previous['product_name'] and p['name'].startswith('Order Tutorial Invitations ')
            for key in ['order_id','refund_order_id']:
                if previous.get(key):
                    o=client.get(f"/admin/orders/{previous[key]}").json()['data'];assert o['customer_email']==previous['email']
                    if o['status'] not in ['cancelled','delivered','refunded']:
                        r=client.post(f"/admin/orders/{previous[key]}/cancel",json={'reason':'Owned interrupted tutorial cleanup; do not fulfil'});r.raise_for_status()
            r=client.patch(f"/admin/products/{previous['product_id']}",json={'status':'draft'});r.raise_for_status()
            r=client.patch(f"/admin/categories/{previous['category_id']}",json={'is_active':False});r.raise_for_status()

# Customer bootstrap uses the same database/auth model, but saves to a separate session.
source = (Path(__file__).resolve().parents[1] / 'catalog-production/prepare-customer.py').read_text().replace('product-lifecycle-session.json','order-lifecycle-session.json').replace('product-tutorial-','order-tutorial-')
exec(compile(source,str(Path(__file__)), 'exec'))

import httpx
import secrets
import json
with httpx.Client(base_url='http://127.0.0.1:8020/api/v1', timeout=40) as client:
    status = client.get('http://127.0.0.1:8020/__tutorial/status').json()
    assert status['environment']=='development' and status['outbound_providers']=='fake' and status['task_broker']=='memory://'
    r=client.post('/admin/auth/login',json={'email':'admin@urgentprinters.com','password':os.environ["QA_ADMIN_PASSWORD"]});r.raise_for_status()
    client.headers['Authorization']='Bearer '+r.json()['data']['access_token']
    path=Path.home()/'.config/urgentprinters-tutorials/order-lifecycle-session.json'
    state=json.loads(path.read_text());suffix=secrets.token_hex(3)
    r=client.post('/admin/media/upload',data={'context':'product'},files={'file':('invitation.png',(ROOT/'urgent-printers-admin-panel/qa-pipeline/playwright/fixtures/catalog-tutorial/front.png').read_bytes(),'image/png')});r.raise_for_status();key=r.json()['data']['key']
    r=client.post('/admin/categories',json={'name':f'Order Tutorials {suffix}','slug':f'order-tutorials-{suffix}','image_keys':[key],'is_active':True});r.raise_for_status();cat=r.json()['data']
    payload={'name':f'Order Tutorial Invitations {suffix}','slug':f'order-tutorial-invitations-{suffix}','short_description':'Premium invitation cards with artwork review before printing.','description':'Printed on 300 GSM art board. Customer proof approval is required before production.','category_id':cat['id'],'status':'active','badge':'none','is_featured':False,'tags':['tutorial'],'sizes':[{'label':'A6 Invitation','width':105,'height':148,'unit':'mm','price_multiplier':1,'is_default':True,'is_active':True}],'paper_types':[{'label':'300 GSM Art Board','gsm':300,'price_multiplier':1,'is_default':True,'is_active':True}],'finishes':[{'label':'Gold Foil','price_multiplier':1,'is_default':True,'is_active':True}],'sides_options':[{'label':'Single Sided','price_multiplier':1,'is_default':True,'is_active':True}],'listing_quantity':100,'min_order_quantity':100,'max_order_quantity':2500,'unit_label':'pcs','pricing_tiers':[{'quantity':100,'price_per_unit':12,'is_best_value':False},{'quantity':250,'price_per_unit':9,'is_best_value':True},{'quantity':500,'price_per_unit':7,'is_best_value':False}],'turnaround_options':[{'type':'standard','days':5,'extra_cost':0,'is_active':True}],'image_keys':[key],'customization_mode':'artwork','template_fields':[],'track_inventory':False}
    r=client.post('/admin/products',json=payload);r.raise_for_status();p=r.json()['data']
    state.update(product_id=p['id'],product_name=p['name'],product_slug=p['slug'],category_id=cat['id'],category_slug=cat['slug'])
    path.write_text(json.dumps(state,indent=2)+'\n');path.chmod(0o600)
    print('Owned artwork-enabled catalogue fixture ready.')
