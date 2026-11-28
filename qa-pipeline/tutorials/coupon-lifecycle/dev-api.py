"""Real development API with fake outbound providers and an in-process task broker.

Uses the existing development database. Never run against production. No worker consumes
this process's memory broker, so recording an order cannot message staff or customers.
"""
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BACKEND = ROOT / "urgent-printers-backend"
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)
os.environ["DEBUG"] = "false"

from app.core.config import settings

if settings.app_env != "development":
    raise RuntimeError("Tutorial API requires APP_ENV=development")

for name in ["email_provider", "sms_provider", "whatsapp_provider", "push_provider", "payment_provider", "shipping_provider", "search_provider"]:
    setattr(settings, name, "fake")
settings.sentry_dsn = ""
settings.debug = False

from app.workers.celery_app import celery_app

celery_app.conf.broker_url = "memory://"
celery_app.conf.result_backend = "cache+memory://"
celery_app.conf.task_always_eager = False

from app.main import app

@app.get("/__tutorial/status", include_in_schema=False)
async def tutorial_status():
    return {"tutorial": True, "environment": settings.app_env, "outbound_providers": "fake", "task_broker": celery_app.conf.broker_url}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8020, log_level="warning")
