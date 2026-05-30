"""
admin_routes.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/admin_routes.py  (REEMPLAZAR COMPLETO)

Cambios de seguridad vs versión anterior:
- Admin tokens persistentes en BD (no en memoria)
- Login con bcrypt (compatible con contraseñas legacy)
- Rate limiting en /app/login y /admin/login
- /app/login devuelve ws_token para WebSockets
"""
from __future__ import annotations
import secrets as _secrets
from fastapi import Depends, FastAPI, HTTPException, Header, Query, Request
from pydantic import BaseModel
from typing import Optional
from app.security import (
    verify_password_any, hash_password,
    create_admin_session, validate_admin_session, delete_admin_session,
    check_rate_limit, get_client_ip,
)


# ── Helpers de autenticación ──────────────────────────────────

def _require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    if not x_admin_token or not validate_admin_session(x_admin_token):
        raise HTTPException(status_code=401, detail="Admin token inválido o expirado.")

# App tokens siguen en memoria (vida corta, se regeneran al login)
_app_tokens: dict[str, str] = {}

def _require_app_token(x_app_token: str | None = Header(default=None)) -> str:
    if not x_app_token or x_app_token not in _app_tokens:
        raise HTTPException(status_code=401, detail="Token de app inválido.")
    return _app_tokens[x_app_token]


# ── Schemas ───────────────────────────────────────────────────

class AdminLogin(BaseModel):
    password: str

class DeviceCreate(BaseModel):
    name: str; sim_number: str
    model: Optional[str] = None; imei: Optional[str] = None
    vehicle_id: Optional[str] = None; notes: Optional[str] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None; sim_number: Optional[str] = None
    model: Optional[str] = None; imei: Optional[str] = None
    vehicle_id: Optional[str] = None; active: Optional[bool] = None
    notes: Optional[str] = None

class ClientCreate(BaseModel):
    username: str; password: str; client_name: str
    email: Optional[str] = None; phone: Optional[str] = None
    vehicle_id: Optional[str] = None; gps_device_id: Optional[str] = None

class ClientUpdate(BaseModel):
    username: Optional[str] = None; password: Optional[str] = None
    client_name: Optional[str] = None; email: Optional[str] = None
    phone: Optional[str] = None; vehicle_id: Optional[str] = None
    gps_device_id: Optional[str] = None; active: Optional[bool] = None

class AppLoginRequest(BaseModel):
    username: str; password: str

class AppCommandRequest(BaseModel):
    command: str

class SmsCommandRequest(BaseModel):
    command: str; client_id: str


def register_admin_routes(app: FastAPI, admin_password_getter) -> None:

    # ── Admin login ───────────────────────────────────────────
    @app.post("/admin/login")
    def admin_login(payload: AdminLogin, request: Request):
        check_rate_limit(get_client_ip(request), "/admin/login")
        if payload.password != admin_password_getter():
            raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
        token = create_admin_session(ip=get_client_ip(request))
        return {"ok": True, "token": token}

    @app.post("/admin/logout")
    def admin_logout(x_admin_token: str | None = Header(default=None)):
        if x_admin_token:
            delete_admin_session(x_admin_token)
        return {"ok": True}

    # ── Preferencias ──────────────────────────────────────────
    @app.get("/admin/preferences")
    def get_preferences(x_admin_token: str | None = Header(default=None)):
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        from app.db import get_conn
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS admin_preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL)
            """)
            cur.execute("SELECT value FROM admin_preferences WHERE key = 'theme'")
            row = cur.fetchone()
        return {"theme": row["value"] if row else "dim"}

    @app.post("/admin/preferences")
    def save_preferences(payload: dict, x_admin_token: str | None = Header(default=None)):
        if not x_admin_token or not validate_admin_session(x_admin_token):
            raise HTTPException(status_code=401, detail="Admin token inválido.")
        theme = payload.get("theme", "dim")
        from app.db import get_conn
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS admin_preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL)
            """)
            cur.execute("""
                INSERT INTO admin_preferences (key, value) VALUES ('theme', %s)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            """, (theme,))
        return {"ok": True}

    # ── Devices ───────────────────────────────────────────────
    @app.get("/admin/devices", dependencies=[Depends(_require_admin)])
    def list_devices():
        from app.admin_repository import get_all_devices
        return get_all_devices()

    @app.get("/admin/devices/{device_id}", dependencies=[Depends(_require_admin)])
    def read_device(device_id: str):
        from app.admin_repository import get_device
        dev = get_device(device_id)
        if not dev: raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")
        return dev

    @app.post("/admin/devices", dependencies=[Depends(_require_admin)])
    def add_device(payload: DeviceCreate):
        from app.admin_repository import get_device_by_sim, create_device
        if get_device_by_sim(payload.sim_number):
            raise HTTPException(status_code=409, detail="Ya existe un dispositivo con ese SIM.")
        return create_device(payload.model_dump())

    @app.patch("/admin/devices/{device_id}", dependencies=[Depends(_require_admin)])
    def edit_device(device_id: str, payload: DeviceUpdate):
        from app.admin_repository import update_device
        data = payload.model_dump(exclude_unset=True)
        if "vehicle_id" in data and not data["vehicle_id"]: data["vehicle_id"] = None
        dev = update_device(device_id, data)
        if not dev: raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")
        return dev

    @app.delete("/admin/devices/{device_id}", dependencies=[Depends(_require_admin)])
    def remove_device(device_id: str):
        from app.admin_repository import delete_device
        if not delete_device(device_id):
            raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")
        return {"ok": True}

    # ── Clients ───────────────────────────────────────────────
    @app.get("/admin/clients", dependencies=[Depends(_require_admin)])
    def list_clients():
        from app.admin_repository import get_all_clients
        return get_all_clients()

    @app.get("/admin/clients/{client_id}", dependencies=[Depends(_require_admin)])
    def read_client(client_id: str):
        from app.admin_repository import get_client
        cli = get_client(client_id)
        if not cli: raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        return cli

    @app.post("/admin/clients", dependencies=[Depends(_require_admin)])
    def add_client(payload: ClientCreate):
        from app.admin_repository import get_client_by_username, create_client
        if get_client_by_username(payload.username):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con ese usuario.")
        data = payload.model_dump()
        # Hashear contraseña al crear
        data["password"]        = hash_password(data["password"])
        data["password_hashed"] = data["password"]
        for fk in ("vehicle_id", "gps_device_id"):
            if not data.get(fk): data[fk] = None
        return create_client(data)

    @app.patch("/admin/clients/{client_id}", dependencies=[Depends(_require_admin)])
    def edit_client(client_id: str, payload: ClientUpdate):
        from app.admin_repository import update_client
        data = payload.model_dump(exclude_unset=True)
        # Si actualizan la contraseña, hashearla
        if "password" in data and data["password"]:
            data["password"]        = hash_password(data["password"])
            data["password_hashed"] = data["password"]
        for fk in ("vehicle_id", "gps_device_id"):
            if fk in data and not data[fk]: data[fk] = None
        cli = update_client(client_id, data)
        if not cli: raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        return cli

    @app.delete("/admin/clients/{client_id}", dependencies=[Depends(_require_admin)])
    def remove_client(client_id: str):
        from app.admin_repository import delete_client
        if not delete_client(client_id):
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        return {"ok": True}

    @app.post("/admin/clients/{client_id}/toggle", dependencies=[Depends(_require_admin)])
    def toggle_client(client_id: str):
        from app.admin_repository import toggle_client_active
        cli = toggle_client_active(client_id)
        if not cli: raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        return cli

    # ── SMS ───────────────────────────────────────────────────
    @app.post("/admin/sms/send", dependencies=[Depends(_require_admin)])
    def send_sms_command(payload: SmsCommandRequest):
        from app.admin_repository import get_client, get_device
        from app.sms_service import send_gps_command
        cli = get_client(payload.client_id)
        if not cli: raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        sim = cli.get("sim_number")
        if not sim and cli.get("gps_device_id"):
            dev = get_device(cli["gps_device_id"])
            sim = dev.get("sim_number") if dev else None
        if not sim: raise HTTPException(status_code=400, detail="Sin SIM asignado.")
        result = send_gps_command(payload.command, sim)
        if not result["ok"]: raise HTTPException(status_code=500, detail=result["error"])
        return result

    @app.get("/admin/sms/commands", dependencies=[Depends(_require_admin)])
    def list_sms_commands():
        from app.sms_service import get_available_commands
        return get_available_commands()

    # ── Logs ──────────────────────────────────────────────────
    @app.get("/admin/logs", dependencies=[Depends(_require_admin)])
    def admin_logs(limit: int = Query(default=200, ge=1, le=500)):
        from app.db import get_conn
        with get_conn() as conn:
            cur = conn.cursor()
            try:
                cur.execute("""
                    SELECT id,from_number,body,received_at,label,icon,lat,lng,speed,battery
                    FROM gps_messages ORDER BY received_at DESC LIMIT %s
                """, (limit,))
                return [{"id":d["id"],"type":"incoming","source":"gps",
                         "from_number":d["from_number"],"body":d["body"],
                         "label":d["label"],"icon":d["icon"],"lat":d["lat"],
                         "lng":d["lng"],"speed":d["speed"],"battery":d["battery"],
                         "received_at":d["received_at"]} for d in cur.fetchall()]
            except Exception:
                return []

    # ── Live position ─────────────────────────────────────────
    @app.get("/admin/live/{client_id}", dependencies=[Depends(_require_admin)])
    def live_position(client_id: str):
        from app.gateway_routes import get_last_position
        pos = get_last_position(client_id)
        if not pos: return {"ok": False, "message": "Sin posición registrada aún."}
        return {"ok": True, **pos}

    @app.get("/admin/live/{client_id}/history", dependencies=[Depends(_require_admin)])
    def live_history(client_id: str, limit: int = 100):
        from app.gateway_routes import get_position_history
        return get_position_history(client_id, limit)

    # ── App login ─────────────────────────────────────────────
    @app.post("/app/login")
    def app_login(payload: AppLoginRequest, request: Request):
        # Rate limiting — máx 10 intentos por minuto por IP
        check_rate_limit(get_client_ip(request), "/app/login")

        from app.admin_repository import get_client_for_login
        from app.db import get_conn

        # Buscar cliente (devuelve la fila con password y password_hashed)
        row = _get_client_login_full(payload.username)
        if not row:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")

        # Verificar contraseña (compatible con plain y bcrypt)
        stored = row.get("password_hashed") or row.get("password") or ""
        if not verify_password_any(payload.password, stored):
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")

        if not row.get("active"):
            raise HTTPException(status_code=403, detail="Cuenta desactivada.")

        if not row.get("sim_number"):
            raise HTTPException(status_code=400, detail="Este cliente no tiene un GPS asignado aún.")

        # Token de sesión
        token = _secrets.token_hex(32)
        _app_tokens[token] = row["id"]

        # ws_token — generar si no tiene
        ws_token = row.get("ws_token")
        if not ws_token:
            ws_token = _secrets.token_urlsafe(32)
            with get_conn() as conn:
                cur = conn.cursor()
                cur.execute("UPDATE app_clients SET ws_token=%s WHERE id=%s",
                            (ws_token, row["id"]))

        return {
            "ok":           True,
            "token":        token,
            "client_id":    row["id"],
            "client_name":  row["client_name"],
            "vehicle_name": row.get("vehicle_name") or "",
            "vehicle_id":   row.get("vehicle_id") or "",
            "sim_number":   row["sim_number"],
            "account_type": row.get("account_type") or "individual",
            "ws_token":     ws_token,
            "phone":        row.get("phone") or "",
        }

    @app.post("/app/logout")
    def app_logout(x_app_token: str | None = Header(default=None)):
        if x_app_token: _app_tokens.pop(x_app_token, None)
        return {"ok": True}

    @app.get("/app/status")
    def app_status(client_id: str = Depends(_require_app_token)):
        from app.admin_repository import get_client
        from app.repository import get_vehicle
        cli = get_client(client_id)
        if not cli: raise HTTPException(status_code=404)
        veh = get_vehicle(cli["vehicle_id"]) if cli.get("vehicle_id") else None
        if not veh: raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
        return {
            "vehicle_id": veh["id"], "vehicle_name": veh["name"],
            "status": veh["status"], "lat": veh["lat"], "lng": veh["lng"],
            "speed": veh["speed"], "geofence": veh.get("geofence"),
            "updated_at": veh.get("updated_at", ""),
        }

    @app.post("/app/command")
    def app_command(payload: AppCommandRequest, client_id: str = Depends(_require_app_token)):
        from app.admin_repository import get_client
        from app.gateway_routes import queue_sms, GPS_COMMANDS, build_sms
        from app.config import GPS_PASSWORD
        cli = get_client(client_id)
        if not cli: raise HTTPException(status_code=404)
        sim = cli.get("sim_number")
        if not sim: raise HTTPException(status_code=400, detail="Sin GPS asignado.")
        cmd_info = GPS_COMMANDS.get(payload.command)
        if not cmd_info: raise HTTPException(status_code=400, detail=f"Comando desconocido: {payload.command}")
        sms_body = build_sms(payload.command, GPS_PASSWORD)
        cmd_id = queue_sms(sim, sms_body, client_id, payload.command)
        return {"ok": True, "command_id": cmd_id, "label": cmd_info["label"]}

    @app.get("/app/responses")
    def app_responses(client_id: str = Depends(_require_app_token)):
        from app.admin_repository import get_client
        from app.db import get_conn
        cli = get_client(client_id)
        if not cli: raise HTTPException(status_code=404)
        sim = cli.get("sim_number", "")
        if not sim: return []
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT body,received_at,label,icon,lat,lng,speed,battery
                FROM gps_messages WHERE from_number LIKE %s
                ORDER BY received_at DESC LIMIT 20
            """, (f"%{sim[-7:]}",))
            return [dict(r) for r in cur.fetchall()]


# ── Helper interno ────────────────────────────────────────────

def _get_client_login_full(username: str) -> dict | None:
    """Trae el cliente con todos los campos necesarios para login."""
    from app.db import get_conn
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.*, d.sim_number, v.name AS vehicle_name
            FROM app_clients c
            LEFT JOIN gps_devices d ON c.gps_device_id = d.id
            LEFT JOIN vehicles    v ON c.vehicle_id    = v.id
            WHERE c.username = %s
        """, (username,))
        row = cur.fetchone()
        return dict(row) if row else None