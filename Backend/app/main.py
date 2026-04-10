from __future__ import annotations

from random import choice

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, CORS_ORIGINS
from app.db import init_db
from app.repository import (
    add_position,
    create_alert,
    create_vehicle,
    delete_vehicle,
    get_alerts,
    get_all_vehicles,
    get_metrics,
    get_positions,
    get_vehicle,
    seed_if_empty,
    update_vehicle,
)
from app.schemas import AlertCreate, FleetResponse, PositionCreate, VehicleCreate, VehicleUpdate
from app.security import require_write_key
from app.utils import now_iso, random_shift

app = FastAPI(title=APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup() -> None:
    init_db()
    seed_if_empty()

@app.get("/health")
def health():
    return {"ok": True, "service": APP_NAME}

@app.get("/fleet", response_model=FleetResponse)
def fleet():
    vehicles_raw = get_all_vehicles()
    alerts_raw = get_alerts(limit=10)
    metrics = get_metrics()

    vehicles = [{
        "id": item["id"],
        "name": item["name"],
        "status": item["status"],
        "lat": item["lat"],
        "lng": item["lng"],
        "speed": item["speed"],
        "geofence": item["geofence"],
        "updatedAt": item["updated_at"],
    } for item in vehicles_raw]

    alerts = [{
        "id": item["id"],
        "type": item["type"],
        "message": item["message"],
        "createdAt": item["created_at"],
        "severity": item["severity"],
    } for item in alerts_raw]

    return {"vehicles": vehicles, "alerts": alerts, "metrics": metrics}

@app.get("/vehicles")
def list_vehicles():
    return get_all_vehicles()

@app.get("/vehicles/{vehicle_id}")
def read_vehicle(vehicle_id: str):
    vehicle = get_vehicle(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@app.post("/vehicles", dependencies=[Depends(require_write_key)])
def create_vehicle_endpoint(payload: VehicleCreate):
    if get_vehicle(payload.id):
        raise HTTPException(status_code=409, detail="Vehicle already exists")
    return create_vehicle(payload.model_dump())

@app.patch("/vehicles/{vehicle_id}", dependencies=[Depends(require_write_key)])
def update_vehicle_endpoint(vehicle_id: str, payload: VehicleUpdate):
    updated = update_vehicle(vehicle_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return updated

@app.delete("/vehicles/{vehicle_id}", dependencies=[Depends(require_write_key)])
def delete_vehicle_endpoint(vehicle_id: str):
    ok = delete_vehicle(vehicle_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"ok": True}

@app.post("/vehicles/{vehicle_id}/position", dependencies=[Depends(require_write_key)])
def add_position_endpoint(vehicle_id: str, payload: PositionCreate):
    updated = add_position(vehicle_id, payload.lat, payload.lng, payload.speed, payload.geofence)
    if not updated:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return updated

@app.get("/vehicles/{vehicle_id}/positions")
def list_positions(vehicle_id: str, limit: int = Query(default=20, ge=1, le=500)):
    if not get_vehicle(vehicle_id):
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return get_positions(vehicle_id, limit=limit)

@app.get("/alerts")
def list_alerts(limit: int = Query(default=20, ge=1, le=200)):
    return get_alerts(limit=limit)

@app.post("/alerts", dependencies=[Depends(require_write_key)])
def create_alert_endpoint(payload: AlertCreate):
    return create_alert(payload.model_dump())

@app.post("/simulate/tick", dependencies=[Depends(require_write_key)])
def simulate_tick():
    vehicles = get_all_vehicles()
    moved = []

    for vehicle in vehicles:
        if vehicle["status"] == "offline":
            continue
        lat = random_shift(vehicle["lat"], 0.003 if vehicle["status"] == "active" else 0.0008)
        lng = random_shift(vehicle["lng"], 0.003 if vehicle["status"] == "active" else 0.0008)
        speed = vehicle["speed"] if vehicle["status"] == "active" else 0
        updated = add_position(vehicle["id"], lat, lng, speed, vehicle.get("geofence"))
        if updated:
            moved.append(updated["id"])

    if moved:
        create_alert({
            "id": f"sim-{now_iso()}",
            "type": "movement",
            "message": f"Movimiento detectado en {choice(moved)}",
            "severity": "medium",
        })

    return {"ok": True, "moved": moved}
