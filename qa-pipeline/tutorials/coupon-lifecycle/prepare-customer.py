"""Provision only dedicated development tutorial customers, outside the recorded UI."""
import asyncio
import json
import secrets
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "urgent-printers-backend"))
os.chdir(ROOT / "urgent-printers-backend")
os.environ["DEBUG"] = "false"
from app.core.config import settings
from app.core.database import AsyncSessionFactory, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.address import Address
from app.models.coupon import Coupon
from app.models.admin_user import AdminUser  # registers the coupon creator FK target

if settings.app_env != "development":
    raise RuntimeError("Customer setup requires the development environment")

async def main():
    password = secrets.token_urlsafe(22)
    suffix = secrets.token_hex(4)
    async with AsyncSessionFactory() as session:
        previous = Path.home() / ".config/urgentprinters-tutorials/coupon-lifecycle-session.json"
        if previous.exists():
            old = json.loads(previous.read_text())
            if old.get("owned_demo") and old.get("coupon_id"):
                coupon = await session.get(Coupon, old["coupon_id"])
                if coupon and coupon.code == old.get("code") and coupon.code.startswith("PRINT10-DEMO-"):
                    coupon.is_active = False
                    session.add(coupon)
        buyer = User(email=f"coupon-tutorial-{suffix}@example.invalid", hashed_password=hash_password(password),
            first_name="Aarav", last_name="Sharma", is_active=True, is_verified=True, whatsapp_opt_in=False)
        session.add(buyer)
        await session.flush()
        session.add(Address(user_id=buyer.id, label="Studio", full_name="Aarav Sharma", phone="9000000000",
            line1="12 Demo Studio, Tutorial Road", city="New Delhi", state="Delhi", postal_code="110001",
            country="India", is_default=True))
        await session.commit()
        state = {"customer_id": buyer.id, "email": buyer.email, "password": password, "owned_demo": True}
    folder = Path.home() / ".config/urgentprinters-tutorials"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "coupon-lifecycle-session.json"
    path.write_text(json.dumps(state, indent=2) + "\n")
    path.chmod(0o600)
    print(f"Dedicated development customer created; credentials saved outside repositories: {path}")
    await engine.dispose()

asyncio.run(main())
