"""
config.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/config.py  (REEMPLAZAR)
"""
from __future__ import annotations
import os, warnings
from dotenv import load_dotenv
load_dotenv()

APP_NAME       = os.getenv("APP_NAME", "GPS Control EC")
API_WRITE_KEY  = os.getenv("API_WRITE_KEY", "changeme123")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
DB_FILE        = os.getenv("DB_FILE", "data.db")
GPS_PASSWORD   = os.getenv("GPS_PASSWORD", "123456")

# GPS_UPDATE_SECRET — sin fallback débil
GPS_UPDATE_SECRET = os.getenv("GPS_UPDATE_SECRET", "")

# CORS — en development acepta todo, en production solo dominios configurados
_IS_DEV = os.getenv("ENVIRONMENT", "production") == "development"

CORS_ORIGINS = (
    ["*"]
    if _IS_DEV
    else [
        item.strip()
        for item in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,"
            "https://gpscontrolec.com,https://www.gpscontrolec.com"
        ).split(",")
        if item.strip()
    ]
)

# ── Advertencias en arranque ──────────────────────────────────
_WEAK_DEFAULTS = {
    "API_WRITE_KEY":  "changeme123",
    "ADMIN_PASSWORD": "admin123",
}
for _key, _weak in _WEAK_DEFAULTS.items():
    if os.getenv(_key, _weak) == _weak:
        warnings.warn(
            f"⚠️  {_key} usa el valor por defecto inseguro. "
            f"Configúralo en .env antes de producción.",
            stacklevel=1
        )