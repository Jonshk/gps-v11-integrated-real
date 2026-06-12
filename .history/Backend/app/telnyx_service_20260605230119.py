"""
telnyx_service.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/telnyx_service.py

Servicio para enviar SMS via Telnyx API v2.
Reemplaza el Gateway Android.
"""
from __future__ import annotations
import os
import httpx
from typing import Optional


TELNYX_API_KEY    = os.getenv("TELNYX_API_KEY", "")
TELNYX_FROM       = os.getenv("TELNYX_FROM_NUMBER", "+12172259657")
TELNYX_API_BASE   = "https://api.telnyx.com/v2"


def send_sms(to: str, body: str) -> dict:
    """
    Envía un SMS via Telnyx.
    Retorna {"ok": True, "id": "..."} o {"ok": False, "error": "..."}
    """
    if not TELNYX_API_KEY:
        return {"ok": False, "error": "TELNYX_API_KEY no configurada."}

    try:
        res = httpx.post(
            f"{TELNYX_API_BASE}/messages",
            headers={
                "Authorization": f"Bearer {TELNYX_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": TELNYX_FROM,
                "to":   to,
                "text": body,
            },
            timeout=15,
        )
        data = res.json()
        if res.status_code in (200, 201):
            msg_id = data.get("data", {}).get("id", "")
            return {"ok": True, "id": msg_id}
        else:
            error = data.get("errors", [{}])[0].get("detail", f"HTTP {res.status_code}")
            return {"ok": False, "error": error}
    except Exception as e:
        return {"ok": False, "error": str(e)}