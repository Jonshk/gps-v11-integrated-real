"""
main.py  (versión infraestructura completa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/main.py  (REEMPLAZAR)

Integra todo:
- Logging estructurado desde el primer import
- Redis startup/shutdown para WebSockets multi-instancia
- SMS queue worker en background
- Endpoint /admin/queue/stats para monitorear la cola
"""
from __future__ import annotations

# ── Logging PRIMERO — antes de cualquier otro import ──────────
from app.logger import setup_logging
setup_logging()

import asyncio, logging
from random import choice
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, ADMIN_PASSWORD, CORS_ORIGINS
from app.db import init_db
from app.repository import (
    add_position, create_alert, create_vehicle, delete_vehicle,
    get_alerts, get_all_vehicles, get_metrics, get_positions,
    get_vehicle, seed_if_empty, update_vehicle,
)
from app.schemas import AlertCreate, FleetResponse, PositionCreate, VehicleCreate, VehicleUpdate
from app.security import require_write_key
from app.utils import now_iso, random_shift
from app.admin_routes import register_admin_routes, _require_admin
from app.plans_routes import register_plan_routes
from app.gateway_routes import register_gateway_routes, init_gateway_table
from app.ws_routes import register_ws_routes
from app.gps_update_routes import register_gps_update_routes
from app.history_routes import register_history_routes
from app.geofence_routes import register_geofence_routes
from app.alerts_routes import register_alerts_routes
from app.sms_queue_worker import sms_queue_worker, get_queue_stats
from app.ws_manager import manager

logger = logging.getLogger(__name__)

app = FastAPI(title=APP_NAME, version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
    allow_headers=["*"],
)

register_admin_routes(app, lambda: ADMIN_PASSWORD)
register_plan_routes(app, _require_admin)
register_gateway_routes(app, _require_admin)
register_ws_routes(app)
register_gps_update_routes(app)
register_history_routes(app)
register_geofence_routes(app)
register_alerts_routes(app)


# ─── Startup y Shutdown ───────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    logger.info("[STARTUP] Iniciando GPS Control EC v4.0")

    # Base de datos
    init_db()
    init_gateway_table()
    seed_if_empty()
    logger.info("[STARTUP] Base de datos OK")

    # Sesiones admin expiradas
    from app.security import cleanup_expired_sessions
    cleanup_expired_sessions()
    logger.info("[STARTUP] Sesiones limpiadas")

    # Redis para WebSockets (si está configurado)
    if hasattr(manager, "startup"):
        await manager.startup()
        logger.info("[STARTUP] Redis WebSocket manager OK")

    # SMS Queue Worker en background
    asyncio.create_task(sms_queue_worker())
    logger.info("[STARTUP] SMS queue worker arrancado")

    # Verificar GPS_UPDATE_SECRET
    import os
    secret = os.getenv("GPS_UPDATE_SECRET", "")
    if not secret or secret == "gps-secret-2024":
        logger.warning("[STARTUP] ⚠️  GPS_UPDATE_SECRET inseguro — configura en .env")

    logger.info("[STARTUP] ✅  GPS Control EC lista")


@app.on_event("shutdown")
async def shutdown() -> None:
    if hasattr(manager, "shutdown"):
        await manager.shutdown()
    logger.info("[SHUTDOWN] GPS Control EC apagado correctamente")


# ─── Health + Stats ───────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True, "service": APP_NAME, "version": "4.0.0"}


@app.get("/admin/queue/stats", dependencies=[Depends(_require_admin)])
def queue_stats():
    """Estado de la cola de SMS — para monitorear en el panel admin."""
    return get_queue_stats()


# ─── Rutas existentes (sin cambios) ───────────────────────────

@app.get("/fleet", response_model=FleetResponse)
def fleet():
    vr = get_all_vehicles(); ar = get_alerts(limit=10); m = get_metrics()
    return {
        "vehicles": [{"id":i["id"],"name":i["name"],"status":i["status"],"lat":i["lat"],
                       "lng":i["lng"],"speed":i["speed"],"geofence":i["geofence"],
                       "updatedAt":i["updated_at"]} for i in vr],
        "alerts":   [{"id":i["id"],"type":i["type"],"message":i["message"],
                       "createdAt":i["created_at"],"severity":i["severity"]} for i in ar],
        "metrics": m,
    }

@app.get("/vehicles")
def list_vehicles(): return get_all_vehicles()

@app.get("/vehicles/{vehicle_id}")
def read_vehicle(vehicle_id: str):
    v = get_vehicle(vehicle_id)
    if not v: raise HTTPException(404, "Vehicle not found")
    return v

@app.post("/vehicles", dependencies=[Depends(require_write_key)])
def create_vehicle_endpoint(payload: VehicleCreate):
    if get_vehicle(payload.id): raise HTTPException(409, "Vehicle already exists")
    return create_vehicle(payload.model_dump())

@app.patch("/vehicles/{vehicle_id}", dependencies=[Depends(require_write_key)])
def update_vehicle_endpoint(vehicle_id: str, payload: VehicleUpdate):
    u = update_vehicle(vehicle_id, payload.model_dump(exclude_unset=True))
    if not u: raise HTTPException(404, "Vehicle not found")
    return u

@app.delete("/vehicles/{vehicle_id}", dependencies=[Depends(require_write_key)])
def delete_vehicle_endpoint(vehicle_id: str):
    if not delete_vehicle(vehicle_id): raise HTTPException(404, "Vehicle not found")
    return {"ok": True}

@app.post("/vehicles/{vehicle_id}/position", dependencies=[Depends(require_write_key)])
def add_position_endpoint(vehicle_id: str, payload: PositionCreate):
    u = add_position(vehicle_id, payload.lat, payload.lng, payload.speed, payload.geofence)
    if not u: raise HTTPException(404, "Vehicle not found")
    return u

@app.get("/vehicles/{vehicle_id}/positions")
def list_positions(vehicle_id: str, limit: int = Query(default=20, ge=1, le=500)):
    if not get_vehicle(vehicle_id): raise HTTPException(404, "Vehicle not found")
    return get_positions(vehicle_id, limit=limit)

@app.get("/alerts")
def list_alerts(limit: int = Query(default=20, ge=1, le=200)):
    return get_alerts(limit=limit)

@app.post("/alerts", dependencies=[Depends(require_write_key)])
def create_alert_endpoint(payload: AlertCreate):
    return create_alert(payload.model_dump())

@app.post("/simulate/tick", dependencies=[Depends(require_write_key)])
def simulate_tick():
    vehicles = get_all_vehicles(); moved = []
    for v in vehicles:
        if v["status"] == "offline": continue
        lat = random_shift(v["lat"], 0.003 if v["status"]=="active" else 0.0008)
        lng = random_shift(v["lng"], 0.003 if v["status"]=="active" else 0.0008)
        u = add_position(v["id"], lat, lng,
                         v["speed"] if v["status"]=="active" else 0, v.get("geofence"))
        if u: moved.append(u["id"])
    if moved:
        create_alert({"id":f"sim-{now_iso()}","type":"movement",
                      "message":f"Movimiento en {choice(moved)}","severity":"medium"})
    return {"ok": True, "moved": moved}