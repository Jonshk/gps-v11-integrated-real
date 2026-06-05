"""
gateway_routes.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/gateway_routes.py  (REEMPLAZAR COMPLETO)

Integración con Telnyx — sin Gateway Android.
- Envío SMS via Telnyx API
- Recepción de respuestas GPS via webhook Telnyx
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Header, Query, Request
from pydantic import BaseModel


# ─────────────────────────────────────────────────────────────
# COMANDOS GPS CENTRALIZADOS
# ─────────────────────────────────────────────────────────────

GPS_COMMANDS: dict[str, dict] = {
    "locate":       {"label":"Localizar",        "sms":"fix060s001n", "icon":"📍", "description":"Ubicación una sola vez"},
    "live_track":   {"label":"Live Tracking",    "sms":"fix030s999n", "icon":"📡", "description":"Ubicación cada 30 segundos"},
    "stop_track":   {"label":"Parar tracking",   "sms":"nofix",       "icon":"⏹️", "description":"Detener seguimiento GPS"},
    "start_engine": {"label":"Encender motor",   "sms":"supplyelec",  "icon":"🟢", "description":"Restaurar alimentación del motor"},
    "stop_engine":  {"label":"Apagar motor",     "sms":"stopelec",    "icon":"🔴", "description":"Cortar alimentación del motor"},
    "move_alert":   {"label":"Alerta movimiento","sms":"move",        "icon":"🚨", "description":"Avisar si el vehículo se mueve"},
    "speed_alert":  {"label":"Alerta velocidad", "sms":"speed 080",   "icon":"⚠️", "description":"Alerta a 80 km/h"},
    "no_speed":     {"label":"Quitar velocidad", "sms":"nospeed",     "icon":"➖", "description":"Desactivar alerta de velocidad"},
    "monitor":      {"label":"Micrófono",        "sms":"monitor",     "icon":"🎤", "description":"Activar escucha ambiente", "needs_call":True},
    "status":       {"label":"Estado GPS",       "sms":"status",      "icon":"ℹ️", "description":"Consultar estado del GPS"},
    "battery":      {"label":"Batería",          "sms":"battery",     "icon":"🔋", "description":"Consultar batería"},
    "reset":        {"label":"Reiniciar",        "sms":"reset",       "icon":"🔄", "description":"Reiniciar dispositivo GPS"},
}


def build_sms(command: str, password: str) -> str:
    command  = (command  or "").strip()
    password = (password or "").strip()
    info     = GPS_COMMANDS.get(command)
    base_sms = str(info["sms"]) if info else command
    if password and base_sms.endswith(password):
        return base_sms
    return f"{base_sms}{password}"


def get_available_commands() -> list[dict]:
    return [
        {"key":key, "label":str(info.get("label",key)), "sms":str(info.get("sms",key)),
         "icon":str(info.get("icon","💬")), "description":str(info.get("description","")),
         "needs_call":bool(info.get("needs_call",False))}
        for key, info in GPS_COMMANDS.items()
    ]


# ─────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────

class GatewaySendRequest(BaseModel):
    client_id: str
    command:   str


# ─────────────────────────────────────────────────────────────
# HELPERS DB
# ─────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_conn():
    from app.db import get_conn
    return get_conn()


def init_gateway_table() -> None:
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sms_queue (
                id TEXT PRIMARY KEY, to_number TEXT NOT NULL, body TEXT NOT NULL,
                client_id TEXT, command TEXT, status TEXT NOT NULL DEFAULT 'queued',
                attempts INTEGER NOT NULL DEFAULT 0, error TEXT,
                needs_call BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT NOT NULL, sent_at TEXT, updated_at TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS gps_messages (
                id TEXT PRIMARY KEY, from_number TEXT, body TEXT NOT NULL,
                received_at TEXT NOT NULL, label TEXT, icon TEXT, parsed_type TEXT,
                lat DOUBLE PRECISION, lng DOUBLE PRECISION, speed DOUBLE PRECISION,
                battery DOUBLE PRECISION, client_id TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS gps_positions (
                id TEXT PRIMARY KEY, client_id TEXT NOT NULL,
                lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
                speed DOUBLE PRECISION, battery DOUBLE PRECISION, recorded_at TEXT NOT NULL
            )
        """)


def queue_sms(to_number: str, body: str, client_id: Optional[str] = None, command: Optional[str] = None) -> str:
    """Envía SMS inmediatamente via Telnyx y guarda en cola."""
    from app.telnyx_service import send_sms

    cmd_id    = str(uuid.uuid4())
    info      = GPS_COMMANDS.get(command or "", {})
    needs_call = bool(info.get("needs_call", False))

    # Enviar via Telnyx directamente
    result = send_sms(to_number, body)
    status = "sent" if result["ok"] else "failed"
    error  = None if result["ok"] else result.get("error")

    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO sms_queue
                (id, to_number, body, client_id, command, status, attempts, needs_call, created_at, sent_at, updated_at, error)
            VALUES (%s,%s,%s,%s,%s,%s,1,%s,%s,%s,%s,%s)
        """, (cmd_id, to_number, body, client_id, command, status, needs_call,
              _now_iso(), _now_iso() if result["ok"] else None, _now_iso(), error))

    return cmd_id


def _get_client_sim(client_id: str) -> str | None:
    from app.admin_repository import get_client, get_device
    cli = get_client(client_id)
    if not cli: return None
    sim = cli.get("sim_number")
    if not sim and cli.get("gps_device_id"):
        dev = get_device(cli["gps_device_id"])
        sim = dev.get("sim_number") if dev else None
    return sim


def _find_client_id_by_sim(from_number: str) -> str | None:
    tail = "".join(ch for ch in (from_number or "") if ch.isdigit())[-7:]
    if not tail: return None
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id FROM app_clients c
            LEFT JOIN gps_devices d ON c.gps_device_id = d.id
            WHERE d.sim_number LIKE %s OR c.phone LIKE %s LIMIT 1
        """, (f"%{tail}", f"%{tail}"))
        row = cur.fetchone()
        return row["id"] if row else None


# ─────────────────────────────────────────────────────────────
# PARSEO DE RESPUESTAS GPS
# ─────────────────────────────────────────────────────────────

def _to_float(v):
    if v is None: return None
    try: return float(str(v).strip())
    except: return None


def parse_gps_sms(body: str) -> dict:
    import re
    raw = body or ""
    b   = raw.lower()
    result = {"label":"GPS","icon":"💬","parsed_type":"unknown","lat":None,"lng":None,"speed":None,"battery":None}

    m = re.search(r"q=([-\d.]+),\s*([-\d.]+)", raw, flags=re.I)
    if m:
        result.update({"label":"Ubicación GPS","icon":"📍","parsed_type":"location","lat":_to_float(m.group(1)),"lng":_to_float(m.group(2))})
        return result

    lat_m = re.search(r"lat[:= ]+([-\d.]+)", raw, flags=re.I)
    lng_m = re.search(r"(?:lon|lng|long)[:= ]+([-\d.]+)", raw, flags=re.I)
    spd_m = re.search(r"speed[:= ]+([\d.]+)", raw, flags=re.I)
    if lat_m and lng_m:
        result.update({"label":"Ubicación GPS","icon":"📍","parsed_type":"location",
                       "lat":_to_float(lat_m.group(1)),"lng":_to_float(lng_m.group(1)),
                       "speed":_to_float(spd_m.group(1)) if spd_m else None})
        return result

    coord_m = re.search(r"([-+]?\d{1,2}\.\d{4,})\s*,\s*([-+]?\d{1,3}\.\d{4,})", raw)
    if coord_m:
        result.update({"label":"Ubicación GPS","icon":"📍","parsed_type":"location",
                       "lat":_to_float(coord_m.group(1)),"lng":_to_float(coord_m.group(2))})
        return result

    if "pwdfail" in b: result.update({"label":"Contraseña incorrecta","icon":"⚠️","parsed_type":"password_error"}); return result
    if "fix ok" in b:  result.update({"label":"Ubicación solicitada","icon":"📍","parsed_type":"live_track_ok"}); return result
    if "nofix ok" in b: result.update({"label":"Tracking detenido","icon":"⏹️","parsed_type":"stop_track"}); return result
    if "stopelec ok" in b or "stop engine" in b: result.update({"label":"Motor apagado","icon":"🔴","parsed_type":"engine_stopped"}); return result
    if "supplyelec ok" in b or "supply engine" in b: result.update({"label":"Motor encendido","icon":"🟢","parsed_type":"engine_started"}); return result
    if "move ok" in b: result.update({"label":"Alerta movimiento","icon":"🚨","parsed_type":"move_alert"}); return result
    if "speed ok" in b: result.update({"label":"Alerta velocidad","icon":"⚠️","parsed_type":"speed_alert"}); return result
    if "monitor ok" in b: result.update({"label":"Micrófono activo","icon":"🎤","parsed_type":"monitor_ok"}); return result
    if "reset ok" in b: result.update({"label":"GPS reiniciado","icon":"🔄","parsed_type":"reset_ok"}); return result

    bat_m = re.search(r"bat[:= ]+\s*(\d+)", raw, flags=re.I)
    if bat_m:
        result.update({"label":"Batería","icon":"🔋","parsed_type":"battery","battery":_to_float(bat_m.group(1))})
        return result

    if "pwr:" in b or "power:" in b:
        result.update({"label":"Estado GPS","icon":"ℹ️","parsed_type":"status"})
        return result

    return result


def _store_inbound_sms(from_number: str, body: str, received_at: Optional[str] = None) -> dict:
    parsed    = parse_gps_sms(body)
    msg_id    = str(uuid.uuid4())
    received  = received_at or _now_iso()
    client_id = _find_client_id_by_sim(from_number)

    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO gps_messages
                (id, from_number, body, received_at, label, icon, parsed_type, lat, lng, speed, battery, client_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (msg_id, from_number, body, received, parsed["label"], parsed["icon"],
              parsed["parsed_type"], parsed["lat"], parsed["lng"], parsed["speed"], parsed["battery"], client_id))

        if client_id and parsed.get("lat") is not None and parsed.get("lng") is not None:
            cur.execute("""
                INSERT INTO gps_positions (id, client_id, lat, lng, speed, battery, recorded_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (str(uuid.uuid4()), client_id, parsed["lat"], parsed["lng"],
                  parsed["speed"], parsed["battery"], received))

    return {"ok":True, "id":msg_id, "client_id":client_id, **parsed}


# ─────────────────────────────────────────────────────────────
# POSICIONES LIVE
# ─────────────────────────────────────────────────────────────

def get_last_position(client_id: str) -> dict | None:
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT lat, lng, speed, battery, recorded_at FROM gps_positions
            WHERE client_id=%s ORDER BY recorded_at DESC LIMIT 1
        """, (client_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_position_history(client_id: str, limit: int = 100) -> list[dict]:
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT lat, lng, speed, battery, recorded_at FROM gps_positions
            WHERE client_id=%s ORDER BY recorded_at DESC LIMIT %s
        """, (client_id, limit))
        return [dict(r) for r in cur.fetchall()]


# ─────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────

def register_gateway_routes(app: FastAPI, require_admin) -> None:

    @app.get("/admin/gateway/commands", dependencies=[Depends(require_admin)])
    def admin_gateway_commands():
        return get_available_commands()

    @app.post("/admin/gateway/send", dependencies=[Depends(require_admin)])
    def admin_gateway_send(payload: GatewaySendRequest):
        from app.config import GPS_PASSWORD
        from app.admin_repository import get_client

        cli = get_client(payload.client_id)
        if not cli: raise HTTPException(status_code=404, detail="Cliente no encontrado.")

        sim = _get_client_sim(payload.client_id)
        if not sim: raise HTTPException(status_code=400, detail="Sin SIM asignado.")

        cmd_info = GPS_COMMANDS.get(payload.command)
        if not cmd_info: raise HTTPException(status_code=400, detail=f"Comando desconocido: {payload.command}")

        sms_body = build_sms(payload.command, GPS_PASSWORD)
        cmd_id   = queue_sms(sim, sms_body, payload.client_id, payload.command)

        return {"ok":True, "command_id":cmd_id, "client_id":payload.client_id,
                "to":sim, "command":payload.command, "sms":sms_body,
                "label":cmd_info["label"], "message":"Comando enviado via Telnyx."}

    # ── Webhook Telnyx — recibe respuestas del GPS ────────────
    @app.post("/gateway/inbound/telnyx")
    async def telnyx_inbound(request: Request):
        """Telnyx llama este endpoint cuando el GPS responde por SMS."""
        try:
            data = await request.json()
        except Exception:
            return {"ok": False}

        # Estructura del webhook Telnyx v2
        event_type = data.get("data", {}).get("event_type", "")
        if event_type != "message.received":
            return {"ok": True, "skipped": True}

        payload    = data.get("data", {}).get("payload", {})
        from_number = payload.get("from", {}).get("phone_number", "")
        body        = payload.get("text", "")
        received_at = payload.get("received_at", "")

        if not body:
            return {"ok": False, "error": "Sin body"}

        result = _store_inbound_sms(from_number, body, received_at or None)
        return result

    # ── Alias para compatibilidad con Gateway Android (por si acaso) ─
    @app.post("/gateway/inbound")
    async def gateway_inbound_legacy(request: Request):
        """Alias legacy por compatibilidad."""
        try:
            data = await request.json()
        except Exception:
            return {"ok": False}
        from_number = data.get("from_number", "")
        body        = data.get("body", "")
        received_at = data.get("received_at")
        if not body: return {"ok": False}
        return _store_inbound_sms(from_number, body, received_at)

    @app.get("/admin/gps-messages", dependencies=[Depends(require_admin)])
    def admin_gps_messages(limit: int = Query(default=20, ge=1, le=200)):
        with _get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, from_number, body, received_at, label, icon,
                       parsed_type, lat, lng, speed, battery, client_id
                FROM gps_messages ORDER BY received_at DESC LIMIT %s
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]

    @app.get("/admin/gateway/queue", dependencies=[Depends(require_admin)])
    def admin_gateway_queue(limit: int = Query(default=50, ge=1, le=200)):
        with _get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, to_number, body, client_id, command, status,
                       attempts, error, created_at, sent_at
                FROM sms_queue ORDER BY created_at DESC LIMIT %s
            """, (limit,))
            return [dict(r) for r in cur.fetchall()]