from __future__ import annotations

import secrets as _secrets
from fastapi import Depends, FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

# ── Sesiones en memoria ───────────────────────────────────────────────────
_admin_sessions: set[str] = set()
_app_tokens: dict[str, str] = {}


def _require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    if not x_admin_token or x_admin_token not in _admin_sessions:
        raise HTTPException(status_code=401, detail="Admin token inválido.")

def _require_app_token(x_app_token: str | None = Header(default=None)) -> str:
    if not x_app_token or x_app_token not in _app_tokens:
        raise HTTPException(status_code=401, detail="Token de app inválido.")
    return _app_tokens[x_app_token]


# ── Schemas ───────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    password: str

class DeviceCreate(BaseModel):
    name: str
    sim_number: str
    model: Optional[str] = None
    imei: Optional[str] = None
    vehicle_id: Optional[str] = None
    notes: Optional[str] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    sim_number: Optional[str] = None
    model: Optional[str] = None
    imei: Optional[str] = None
    vehicle_id: Optional[str] = None
    active: Optional[int] = None
    notes: Optional[str] = None

class ClientCreate(BaseModel):
    username: str
    password: str
    client_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    vehicle_id: Optional[str] = None
    gps_device_id: Optional[str] = None

class ClientUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    client_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    vehicle_id: Optional[str] = None
    gps_device_id: Optional[str] = None
    active: Optional[int] = None

class AppLoginRequest(BaseModel):
    username: str
    password: str

class SmsCommandRequest(BaseModel):
    command: str
    client_id: str


def register_admin_routes(app: FastAPI, admin_password_getter) -> None:

    # ── Admin login ───────────────────────────────────────────────────────

    @app.post("/admin/login")
    def admin_login(payload: AdminLogin):
        if payload.password != admin_password_getter():
            raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
        token = _secrets.token_hex(32)
        _admin_sessions.add(token)
        return {"ok": True, "token": token}

    @app.post("/admin/logout")
    def admin_logout(x_admin_token: str | None = Header(default=None)):
        if x_admin_token:
            _admin_sessions.discard(x_admin_token)
        return {"ok": True}

    # ── GPS Devices ───────────────────────────────────────────────────────

    @app.get("/admin/devices", dependencies=[Depends(_require_admin)])
    def list_devices():
        from app.admin_repository import get_all_devices
        return get_all_devices()

    @app.get("/admin/devices/{device_id}", dependencies=[Depends(_require_admin)])
    def read_device(device_id: str):
        from app.admin_repository import get_device
        dev = get_device(device_id)
        if not dev:
            raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")
        return dev

    @app.post("/admin/devices", dependencies=[Depends(_require_admin)])
    def add_device(payload: DeviceCreate):
        from app.admin_repository import get_device_by_sim, create_device
        if get_device_by_sim(payload.sim_number):
            raise HTTPException(status_code=409, detail="Ya existe un dispositivo con ese número SIM.")
        return create_device(payload.model_dump())

    @app.patch("/admin/devices/{device_id}", dependencies=[Depends(_require_admin)])
    def edit_device(device_id: str, payload: DeviceUpdate):
        from app.admin_repository import update_device
        dev = update_device(device_id, payload.model_dump(exclude_unset=True))
        if not dev:
            raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")
        return dev

    @app.delete("/admin/devices/{device_id}", dependencies=[Depends(_require_admin)])
    def remove_device(device_id: str):
        from app.admin_repository import delete_device
        if not delete_device(device_id):
            raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")
        return {"ok": True}

    # ── Clients ───────────────────────────────────────────────────────────

    @app.get("/admin/clients", dependencies=[Depends(_require_admin)])
    def list_clients():
        from app.admin_repository import get_all_clients
        return get_all_clients()

    @app.get("/admin/clients/{client_id}", dependencies=[Depends(_require_admin)])
    def read_client(client_id: str):
        from app.admin_repository import get_client
        cli = get_client(client_id)
        if not cli:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        return cli

    @app.post("/admin/clients", dependencies=[Depends(_require_admin)])
    def add_client(payload: ClientCreate):
        from app.admin_repository import get_client_by_username, create_client
        if get_client_by_username(payload.username):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con ese usuario.")
        data = payload.model_dump()
        for fk in ("vehicle_id", "gps_device_id"):
            if not data.get(fk):
                data[fk] = None
        return create_client(data)

    @app.patch("/admin/clients/{client_id}", dependencies=[Depends(_require_admin)])
    def edit_client(client_id: str, payload: ClientUpdate):
        from app.admin_repository import update_client
        data = payload.model_dump(exclude_unset=True)
        for fk in ("vehicle_id", "gps_device_id"):
            if fk in data and not data[fk]:
                data[fk] = None
        cli = update_client(client_id, data)
        if not cli:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
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
        if not cli:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        return cli

    # ── SMS Commands via Twilio ───────────────────────────────────────────

    @app.post("/admin/sms/send", dependencies=[Depends(_require_admin)])
    def send_sms_command(payload: SmsCommandRequest):
        """
        Envía un comando SMS al GPS del cliente via Twilio.
        El número SIM viene del dispositivo asignado al cliente — nunca del frontend.
        """
        from app.admin_repository import get_client
        from app.sms_service import send_gps_command

        cli = get_client(payload.client_id)
        if not cli:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")

        sim_number = cli.get("sim_number") or cli.get("gps_sim")
        if not sim_number:
            # Intentar obtener SIM desde el dispositivo asignado
            from app.admin_repository import get_device
            device_id = cli.get("gps_device_id")
            if device_id:
                dev = get_device(device_id)
                sim_number = dev.get("sim_number") if dev else None

        if not sim_number:
            raise HTTPException(
                status_code=400,
                detail="Este cliente no tiene un GPS con SIM asignado.")

        result = send_gps_command(payload.command, sim_number)

        if not result["ok"]:
            raise HTTPException(status_code=500, detail=result["error"])

        return result

    @app.get("/admin/sms/commands", dependencies=[Depends(_require_admin)])
    def list_sms_commands():
        """Lista todos los comandos GPS disponibles."""
        from app.sms_service import get_available_commands
        return get_available_commands()

    # ── App login (APK del cliente) ───────────────────────────────────────

    @app.post("/app/login")
    def app_login(payload: AppLoginRequest):
        from app.admin_repository import get_client_for_login
        row = get_client_for_login(payload.username, payload.password)
        if not row:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
        if not row.get("sim_number"):
            raise HTTPException(status_code=400, detail="Este cliente no tiene un GPS asignado aún.")
        token = _secrets.token_hex(32)
        _app_tokens[token] = row["id"]
        return {
            "ok": True,
            "token": token,
            "client_name": row["client_name"],
            "vehicle_name": row.get("vehicle_name") or "",
            "vehicle_id": row["vehicle_id"] or "",
            "sim_number": row["sim_number"],
        }

    @app.post("/app/logout")
    def app_logout(x_app_token: str | None = Header(default=None)):
        if x_app_token:
            _app_tokens.pop(x_app_token, None)
        return {"ok": True}

    @app.get("/app/status")
    def app_status(client_id: str = Depends(_require_app_token)):
        from app.admin_repository import get_client
        from app.repository import get_vehicle
        cli = get_client(client_id)
        if not cli:
            raise HTTPException(status_code=404)
        veh = get_vehicle(cli["vehicle_id"]) if cli.get("vehicle_id") else None
        if not veh:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
        return {
            "vehicle_id": veh["id"],
            "vehicle_name": veh["name"],
            "status": veh["status"],
            "lat": veh["lat"],
            "lng": veh["lng"],
            "speed": veh["speed"],
            "geofence": veh.get("geofence"),
            "updated_at": veh.get("updated_at", ""),
        }
