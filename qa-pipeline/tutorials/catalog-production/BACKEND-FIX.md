# Public product visibility fix discovered during recording

Saving a product as Draft set its status and active flag correctly, but the public detail service still returned the product by slug. This also let retired products remain reachable through old direct URLs. Public listings already filtered inactive products.

`app/services/product_service.py` now rejects missing, uncategorized, inactive, draft and archived products. Admin detail access is unchanged because it reads the repository by ID. `app/services/product_cache.py` advances public detail keys from v9 to v10, so previously cached draft/archived details cannot bypass the new rule. Normal admin mutations continue to invalidate current product detail caches.

The production archive includes the affected backend files and regression tests under `backend-fixes/`. Copy these into the sibling `urgent-printers-backend` at the same relative paths when restoring an older checkout. This is an application fix; it is not a mocked tutorial response.

Run the isolated regression checks in the backend without shared database/Redis pytest setup:

```bash
DEBUG=false .venv/bin/python -m unittest discover -s tests/unit -p test_product_detail_visibility.py -v
```

Three tests cover active access, both private statuses including inconsistent legacy active flags, and missing/inactive/uncategorized products. The real browser capture additionally primes a live product detail, saves it as Draft and verifies the public API returns 404 while the existing order snapshot retains its original item quantity and price.
