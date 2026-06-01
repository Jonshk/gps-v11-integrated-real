from __future__ import annotations
import json
import re
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.db import get_conn


# ── Schemas ───────────────────────────────────────────────────────────────

class IncomingSmsPayload(BaseModel):
    from_number: str
    body: str
    received_at: Optional[str] = None
    model_config = {"populate_by_name": True}

class ConfirmPayload(BaseModel):
    command_id: str
    success: bool

class GatewaySendPayload(BaseModel):
    client_id: str
    command: str


# ── Comandos GPS TK103 completos ──────────────────────────────────────────

GPS_COMMANDS = {
    "tracker":        {"sms": "tracker{p}",         "label": "Activar tracker",       "icon": "📡", "color": "#00d4a0", "sequence": None},
    "locate":         {"sms": "fix060s999n{p}",    "label": "Localizar (60s SMS)",   "icon": "📍", "color": "#00d4a0", "sequence": None},
    "stop_engine":    {"sms": "stopelec{p}",         "label": "Apagar motor",          "icon": "🔴", "color": "#e8232a", "sequence": None},
    "start_engine":   {"sms": "supplyelec{p}",       "label": "Encender motor",        "icon": "🟢", "color": "#00d4a0", "sequence": None},
    "move_alert":     {"sms": "move{p}",             "label": "Alerta movimiento",     "icon": "🚨", "color": "#fbbf24", "sequence": None},
    "speed_alert":    {"sms": "speed{p} 080",        "label": "Alerta velocidad 80",   "icon": "⚡", "color": "#fb923c", "sequence": None},
    "no_speed":       {"sms": "nospeed{p}",          "label": "Desactivar vel.",       "icon": "✋", "color": "#6b7280", "sequence": None},
    "monitor":        {"sms": "monitor{p}",          "label": "Activar micrófono",     "icon": "🎤", "color": "#a78bfa", "sequence": None, "call_after": True},
    "fix60":          {"sms": "fix060s999n{p}",      "label": "Track cada 60s SMS",    "icon": "📍", "color": "#00b4d8", "sequence": None},
    "fix30":          {"sms": "fix030s999n{p}",      "label": "Track cada 30s SMS",    "icon": "📍", "color": "#0099CC", "sequence": None},
    "live_track":     {"sms": "fix030s999n{p}",      "label": "Tracking en vivo",      "icon": "🗺️", "color": "#60a5fa", "sequence": None},
    "stop_track":     {"sms": "nofix{p}",            "label": "Parar tracking",        "icon": "⏹️", "color": "#6b7280", "sequence": None},
    "status":         {"sms": "status{p}",           "label": "Estado GPS",            "icon": "ℹ️", "color": "#60a5fa", "sequence": None},
    "battery":        {"sms": "battery{p}",          "label": "Estado batería",        "icon": "🔋", "color": "#34d399", "sequence": None},
    "gprs":           {"sms": "gprs{p}",             "label": "Estado GPRS",           "icon": "📶", "color": "#60a5fa", "sequence": None},
    "reset":          {"sms": "reset{p}",            "label": "Reiniciar GPS",         "icon": "🔄", "color": "#fb923c", "sequence": None},
    "set_admin":      {"sms": "admin{p} {phone}",    "label": "Configurar admin",      "icon": "👤", "color": "#6b7280", "sequence": None},
}

def build_sms(command_key: str, password: str, phone: str = "") -> str:
    cmd = GPS_COMMANDS.get(command_key)
    if not cmd:
        raise ValueError(f"Comando desconocido: {command_key}")
    return cmd["sms"].format(p=password, phone=phone)


# ── Parser de respuestas TK103 ─────────────────────────────────────────────

def parse_gps_response(body: str) -> dict:
    result = {
        "parsed_type": "unknown",
        "label": "Mensaje GPS",
        "icon": "💬",
        "lat": None,
        "lng": None,
        "speed": None,
        "battery": None,
        "extra": {},
    }
    b = body.lower().strip()

    if "maps.google.com" in b or "maps?q=" in b:
        result["parsed_type"] = "location"
        result["label"] = "📍 Ubicación recibida"
        result["icon"] = "📍"
        try:
            coords = re.search(r"q=([-\d.]+),([-\d.]+)", body)
            if coords:
                result["lat"] = float(coords.group(1))
                result["lng"] = float(coords.group(2))
            speed = re.search(r"speed[:\s]*([\d.]+)", b)
            if speed: result["speed"] = float(speed.group(1))
            bat = re.search(r"bat[:\s]*([\d]+)%?", b)
            if bat: result["battery"] = int(bat.group(1))
        except Exception:
            pass

    elif re.search(r"lat[:\s]*([-\d.]+)", b) and re.search(r"lng?[:\s]*([-\d.]+)", b):
        result["parsed_type"] = "location"
        result["label"] = "📍 Ubicación recibida"
        result["icon"] = "📍"
        try:
            lat = re.search(r"lat[:\s]*([-\d.]+)", b)
            lng = re.search(r"lon?g?[:\s]*([-\d.]+)", b)
            if lat: result["lat"] = float(lat.group(1))
            if lng: result["lng"] = float(lng.group(1))
            speed = re.search(r"speed[:\s]*([\d.]+)", b)
            if speed: result["speed"] = float(speed.group(1))
        except Exception:
            pass

    elif "stop engine" in b or "stop ok" in b or "stopelec ok" in b:
        result["parsed_type"] = "engine_stopped"
        result["label"] = "🔴 Motor apagado correctamente"
        result["icon"] = "🔴"

    elif "supply engine" in b or "supply ok" in b or "resume" in b or "supplyelec ok" in b:
        result["parsed_type"] = "engine_started"
        result["label"] = "🟢 Motor encendido correctamente"
        result["icon"] = "🟢"

    elif "tracker ok" in b:
        result["parsed_type"] = "tracker_ok"
        result["label"] = "📡 Modo tracker activado"
        result["icon"] = "📡"

    elif "monitor ok" in b:
        result["parsed_type"] = "monitor_ok"
        result["label"] = "🎤 Micrófono activado — llama al GPS"
        result["icon"] = "🎤"

    elif "move alarm" in b or "move ok" in b:
        result["parsed_type"] = "move_alert"
        result["label"] = "🚨 Alerta de movimiento"
        result["icon"] = "🚨"
        try:
            lat = re.search(r"lat[:\s]*([-\d.]+)", b)
            lng = re.search(r"lon?g?[:\s]*([-\d.]+)", b)
            if lat: result["lat"] = float(lat.group(1))
            if lng: result["lng"] = float(lng.group(1))
        except Exception:
            pass

    elif "speed ok" in b or "overspeed" in b:
        result["parsed_type"] = "speed_alert"
        result["label"] = "⚡ Alerta de velocidad"
        result["icon"] = "⚡"

    elif "fix ok" in b or "tracking" in b:
        result["parsed_type"] = "live_track_ok"
        result["label"] = "🗺️ Tracking en vivo activado"
        result["icon"] = "🗺️"

    elif "battery" in b or "power" in b:
        result["parsed_type"] = "battery"
        result["label"] = "🔋 Estado de batería"
        result["icon"] = "🔋"
        try:
            bat = re.search(r"([\d]+)%?", b)
            if bat: result["battery"] = int(bat.group(1))
        except Exception:
            pass

    elif "gprs ok" in b:
        result["parsed_type"] = "gprs_ok"
        result["label"] = "📶 GPRS OK"
        result["icon"] = "📶"

    elif "sos" in b:
        result["parsed_type"] = "sos_alert"
        result["label"] = "🆘 ALERTA SOS"
        result["icon"] = "🆘"

    elif "reset ok" in b or "reboot" in b:
        result["parsed_type"] = "reset_ok"
        result["label"] = "🔄 GPS reiniciado"
        result["icon"] = "🔄"

    elif "status" in b or "imei" in b:
        result["parsed_type"] = "status"
        result["label"] = "ℹ️ Estado del GPS"
        result["icon"] = "ℹ️"

    return result


# ── DB helpers ────────────────────────────────────────────────────────────

def init_gateway_table() -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sms_queue (
                id          TEXT PRIMARY KEY,
                to_number   TEXT NOT NULL,
                body        TEXT NOT NULL,
                client_id   TEXT,
                command     TEXT,
                status      TEXT NOT NULL DEFAULT 'pending',
                created_at  TEXT NOT NULL,
                sent_at     TEXT,
                error       TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS gps_messages (
                id          SERIAL PRIMARY KEY,
                from_number TEXT NOT NULL,
                body        TEXT NOT NULL,
                received_at TEXT NOT NULL,
                parsed_type TEXT,
                label       TEXT,
                icon        TEXT,
                lat         REAL,
                lng         REAL,
                speed       REAL,
                battery     INTEGER,
                raw         TEXT
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS gps_positions (
                id          SERIAL PRIMARY KEY,
                client_id   TEXT,
                from_number TEXT NOT NULL,
                lat         REAL NOT NULL,
                lng         REAL NOT NULL,
                speed       REAL,
                battery     INTEGER,
                recorded_at TEXT NOT NULL
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS live_tracking (
                client_id   TEXT PRIMARY KEY,
                active      BOOLEAN NOT NULL DEFAULT FALSE,
                started_at  TEXT
            )
        """)


def queue_sms(to_number: str, body: str, client_id: str = None, command: str = None) -> str:
    cmd_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO sms_queue (id, to_number, body, client_id, command, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s)
        """, (cmd_id, to_number, body, client_id, command, now))
    return cmd_id


def save_message(from_number: str, body: str, parsed: dict) -> dict:
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO gps_messages
            (from_number, body, received_at, parsed_type, label, icon, lat, lng, speed, battery, raw)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            from_number, body, now,
            parsed.get("parsed_type"), parsed.get("label"), parsed.get("icon"),
            parsed.get("lat"), parsed.get("lng"), parsed.get("speed"),
            parsed.get("battery"), json.dumps({"body": body}),
        ))
        msg_id = cur.fetchone()["id"]

        if parsed.get("lat") and parsed.get("lng"):
            cur.execute("""
                SELECT c.id FROM app_clients c
                JOIN gps_devices d ON c.gps_device_id = d.id
                WHERE d.sim_number = %s
            """, (from_number,))
            row = cur.fetchone()
            client_id = row["id"] if row else None
            cur.execute("""
                INSERT INTO gps_positions (client_id, from_number, lat, lng, speed, battery, recorded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                client_id, from_number,
                parsed["lat"], parsed["lng"],
                parsed.get("speed"), parsed.get("battery"), now,
            ))

    return {"id": msg_id, "from_number": from_number, "body": body,
            "received_at": now, **parsed}


def get_last_position(client_id: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM gps_positions
            WHERE client_id = %s
            ORDER BY recorded_at DESC LIMIT 1
        """, (client_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_position_history(client_id: str, limit: int = 100) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM gps_positions
            WHERE client_id = %s
            ORDER BY recorded_at DESC LIMIT %s
        """, (client_id, limit))
        return [dict(r) for r in cur.fetchall()]


# ── Routes ────────────────────────────────────────────────────────────────

def register_gateway_routes(app: FastAPI, require_admin_fn) -> None:

    # ── APK consulta comandos pendientes ──────────────────────────────────
    @app.get("/gateway/pending")
    def gateway_pending(x_api_key: str | None = Header(default=None)):
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, to_number, body, command FROM sms_queue
                WHERE status = 'pending'
                ORDER BY created_at ASC LIMIT 10
            """)
            rows = [dict(r) for r in cur.fetchall()]
        return [
            {
                "id":      r["id"],
                "to":      r["to_number"],
                "body":    r["body"],
                "command": r["command"] or "",
            }
            for r in rows
        ]

    # ── APK confirma envío ────────────────────────────────────────────────
    @app.post("/gateway/confirm")
    def gateway_confirm(payload: ConfirmPayload, x_api_key: str | None = Header(default=None)):
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")
        now = datetime.utcnow().isoformat()
        status = 'sent' if payload.success else 'failed'
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE sms_queue SET status=%s, sent_at=%s WHERE id=%s",
                        (status, now, payload.command_id))
        return {"ok": True}

    # ── APK reporta SMS recibido del GPS ──────────────────────────────────
    @app.post("/gateway/incoming")
    def gateway_incoming(payload: IncomingSmsPayload, x_api_key: str | None = Header(default=None)):
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")
        parsed = parse_gps_response(payload.body)
        result = save_message(payload.from_number, payload.body, parsed)
        return {"ok": True, "parsed_type": parsed.get("parsed_type"), "id": result.get("id")}

    # ── Admin envía comando al GPS via gateway ────────────────────────────
    @app.post("/admin/gateway/send")
    def admin_gateway_send(payload: GatewaySendPayload, x_admin_token: str | None = Header(default=None)):
        from app.security import validate_admin_session
        from app.admin_repository import get_client, get_device
        from app.config import GPS_PASSWORD
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")

        cli = get_client(payload.client_id)
        if not cli:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")

        sim_number = cli.get("sim_number")
        if not sim_number and cli.get("gps_device_id"):
            dev = get_device(cli["gps_device_id"])
            sim_number = dev.get("sim_number") if dev else None
        if not sim_number:
            raise HTTPException(status_code=400, detail="Sin SIM asignado.")

        cmd_info = GPS_COMMANDS.get(payload.command)
        if not cmd_info:
            raise HTTPException(status_code=400, detail=f"Comando desconocido: {payload.command}")

        sequence = cmd_info.get("sequence")
        if sequence and len(sequence) > 1:
            ids = []
            for step in sequence:
                sms_body = build_sms(step, GPS_PASSWORD)
                cmd_id = queue_sms(sim_number, sms_body, payload.client_id, step)
                ids.append(cmd_id)
            return {
                "ok": True,
                "sequence": sequence,
                "command_ids": ids,
                "status": "queued",
                "call_after": cmd_info.get("call_after", False),
                "label": cmd_info["label"],
            }
        else:
            sms_body = build_sms(payload.command, GPS_PASSWORD)
            cmd_id = queue_sms(sim_number, sms_body, payload.client_id, payload.command)
            return {
                "ok": True,
                "command_id": cmd_id,
                "status": "queued",
                "call_after": cmd_info.get("call_after", False),
                "label": cmd_info["label"],
                "sim_number": sim_number,
            }

    # ── Lista de comandos disponibles ─────────────────────────────────────
    @app.get("/admin/gateway/commands")
    def list_commands(x_admin_token: str | None = Header(default=None)):
        from app.security import validate_admin_session
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        return [
            {"key": k, "label": v["label"], "icon": v["icon"],
             "color": v["color"], "call_after": v.get("call_after", False),
             "has_sequence": bool(v.get("sequence"))}
            for k, v in GPS_COMMANDS.items()
        ]

    # ── Mensajes recibidos del GPS ────────────────────────────────────────
    @app.get("/admin/gps-messages")
    def list_gps_messages(x_admin_token: str | None = Header(default=None), limit: int = 50):
        from app.security import validate_admin_session
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM gps_messages ORDER BY received_at DESC LIMIT %s", (limit,))
            return [dict(r) for r in cur.fetchall()]

    @app.delete("/admin/gps-messages")
    def clear_gps_messages(x_admin_token: str | None = Header(default=None)):
        from app.security import validate_admin_session
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM gps_messages")
        return {"ok": True}

    # ── Posición en tiempo real ───────────────────────────────────────────
    @app.get("/admin/live/{client_id}")
    def live_position(client_id: str, x_admin_token: str | None = Header(default=None)):
        from app.security import validate_admin_session
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        pos = get_last_position(client_id)
        if not pos:
            return {"ok": False, "message": "Sin posición registrada aún."}
        return {"ok": True, **pos}

    @app.get("/admin/live/{client_id}/history")
    def live_history(client_id: str, limit: int = 100, x_admin_token: str | None = Header(default=None)):
        from app.security import validate_admin_session
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        return get_position_history(client_id, limit)

    # ── Estado de la cola ─────────────────────────────────────────────────
    @app.get("/admin/gateway/queue")
    def gateway_queue(x_admin_token: str | None = Header(default=None), limit: int = 50):
        from app.security import validate_admin_session
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM sms_queue ORDER BY created_at DESC LIMIT %s", (limit,))
            return [dict(r) for r in cur.fetchall()]