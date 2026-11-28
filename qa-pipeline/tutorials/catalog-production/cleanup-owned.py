"""Clean up only this tutorial's interrupted development product/order."""
import json
import os
from pathlib import Path
import httpx

state_path = Path.home() / '.config/urgentprinters-tutorials/catalog-session.json'
if not state_path.exists():
    raise SystemExit(0)
state = json.loads(state_path.read_text())
if not state.get('owned_demo') or not state.get('product_id'):
    raise SystemExit(0)
with httpx.Client(base_url='http://127.0.0.1:8020', timeout=30) as client:
    status = client.get('/__tutorial/status').json()
    assert status.get('environment') == 'development' and status.get('outbound_providers') == 'fake' and status.get('task_broker') == 'memory://'
    response = client.post('/api/v1/admin/auth/login', json={'email': os.environ.get('QA_ADMIN_EMAIL', 'admin@urgentprinters.com'), 'password': os.environ["QA_ADMIN_PASSWORD"]})
    response.raise_for_status()
    client.headers['Authorization'] = 'Bearer ' + response.json()['data']['access_token']
    response = client.get(f"/api/v1/admin/products/{state['product_id']}")
    response.raise_for_status()
    product = response.json()['data']
    assert product['slug'] == state.get('product_slug') and product['name'] == state.get('product_name') and product['name'].startswith('Foil Wedding Invitations ')
    if state.get('order_id') and not state.get('order_cancelled'):
        response = client.get(f"/api/v1/admin/orders/{state['order_id']}")
        response.raise_for_status()
        order = response.json()['data']
        assert any(str(i.get('product_id')) == str(state['product_id']) and i.get('product_name') == product['name'] for i in order['items'])
        if order['status'] != 'cancelled':
            response = client.post(f"/api/v1/admin/orders/{state['order_id']}/cancel", json={'reason': 'Interrupted development tutorial cleanup; do not fulfil'})
            response.raise_for_status()
        state['order_cancelled'] = True
        print('Owned interrupted development order cancelled.')
    response = client.patch(f"/api/v1/admin/products/{state['product_id']}", json={'status': 'draft'})
    response.raise_for_status()
    state['product_inactive'] = True
    state_path.write_text(json.dumps(state, indent=2) + '\n')
    state_path.chmod(0o600)
    print('Owned development product is inactive.')
