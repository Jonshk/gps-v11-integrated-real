from __future__ import annotations
import json
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.db import get_conn


class IncomingSmsPayload(BaseModel):
    from_number: str
    body: str
    received_at: Optional[str] = None

    model_config = {"populate_by_name": True}


class ConfirmPayload(BaseModel):
    command_id: str
    success: bool


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
                lat         REAL,
                lng         REAL,
                speed       REAL,
                raw         TEXT
            )
        """)


def parse_gps_response(body: str) -> dict:
    import re
    result = {"parsed_type": "unknown", "lat": None, "lng": None, "speed": None}
    b = body.lower()

    if "maps.google.com" in b or "maps?q=" in b:
        result["parsed_type"] = "location"
        try:
            coords = re.search(r"q=([-\d.]+),([-\d.]+)", body)
            if coords:
                result["lat"] = float(coords.group(1))
                result["lng"] = float(coords.group(2))
        except Exception:
            pass
    elif "stop engine" in b or "stop ok" in b:
        result["parsed_type"] = "engine_stopped"
    elif "resume" in b or "supply" in b:
        result["parsed_type"] = "engine_started"
    elif "move alarm" in b:
        result["parsed_type"] = "move_alert"
    elif "speed" in b:
        result["parsed_type"] = "speed_alert"
    elif "tracker" in b or "online" in b:
        result["parsed_type"] = "status_ok"
    elif "monitor" in b:
        result["parsed_type"] = "monitor_ok"
    elif "battery" in b:
        result["parsed_type"] = "battery_alert"
    elif "sos" in b:
        result["parsed_type"] = "sos_alert"

    return result


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


def register_gateway_routes(app: FastAPI, require_admin_fn) -> None:

    def _check_key(x_api_key: str | None = Header(default=None)) -> None:
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")

    @app.get("/gateway/pending")
    def gateway_pending(x_api_key: str | None = Header(default=None)):
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, to_number, body FROM sms_queue
                WHERE status = 'pending'
                ORDER BY created_at ASC LIMIT 10
            """)
            rows = [dict(r) for r in cur.fetchall()]
        return [{"id": r["id"], "to": r["to_number"], "body": r["body"]} for r in rows]

    @app.post("/gateway/confirm")
    def gateway_confirm(payload: ConfirmPayload, x_api_key: str | None = Header(default=None)):
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")
        now = datetime.utcnow().isoformat()
        status = 'sent' if payload.success else 'failed'
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                UPDATE sms_queue SET status=%s, sent_at=%s WHERE id=%s
            """, (status, now, payload.command_id))
        return {"ok": True}

    @app.post("/gateway/incoming")
    def gateway_incoming(payload: IncomingSmsPayload, x_api_key: str | None = Header(default=None)):
        from app.config import API_WRITE_KEY
        if x_api_key != API_WRITE_KEY:
            raise HTTPException(status_code=401, detail="API key inválida.")
        parsed = parse_gps_response(payload.body)
        now = payload.received_at or datetime.utcnow().isoformat()
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO gps_messages (from_number, body, received_at, parsed_type, lat, lng, speed, raw)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                payload.from_number, payload.body, now,
                parsed.get("parsed_type"), parsed.get("lat"),
                parsed.get("lng"), parsed.get("speed"),
                json.dumps({"body": payload.body}),
            ))
        return {"ok": True, "parsed_type": parsed.get("parsed_type")}

    @app.post("/admin/gateway/send")
    def admin_gateway_send(payload: dict, x_admin_token: str | None = Header(default=None)):
        from app.admin_routes import _admin_sessions
        if not x_admin_token or x_admin_token not in _admin_sessions:
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        to_number = payload.get("to_number")
        body      = payload.get("body")
        if not to_number or not body:
            raise HTTPException(status_code=400, detail="to_number y body requeridos.")
        cmd_id = queue_sms(to_number, body, payload.get("client_id"), payload.get("command"))
        return {"ok": True, "command_id": cmd_id, "status": "queued"}

    @app.get("/admin/gps-messages")
    def list_gps_messages(x_admin_token: str | None = Header(default=None), limit: int = 50):
        from app.admin_routes import _admin_sessions
        if not x_admin_token or x_admin_token not in _admin_sessions:
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM gps_messages ORDER BY received_at DESC LIMIT %s", (limit,))
            return [dict(r) for r in cur.fetchall()]

    @app.delete("/admin/gps-messages")
    def clear_gps_messages(x_admin_token: str | None = Header(default=None)):
        from app.admin_routes import _admin_sessions
        if not x_admin_token or x_admin_token not in _admin_sessions:
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM gps_messages")
        return {"ok": True}