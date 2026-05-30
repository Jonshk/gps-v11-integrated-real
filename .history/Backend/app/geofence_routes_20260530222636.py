"""
geofence_routes.py
Va en: Backend/app/geofence_routes.py
"""
from __future__ import annotations
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.db import get_conn
import math, uuid, json


class GeofenceCreate(BaseModel):
    client_id: str
    name: str
    type: str = "circle"
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius_m: Optional[float] = None
    polygon: Optional[List[dict]] = None
    alert_enter: bool = True
    alert_exit: bool = True


class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    radius_m: Optional[float] = None
    polygon: Optional[List[dict]] = None
    alert_enter: Optional[bool] = None
    alert_exit: Optional[bool] = None
    active: Optional[bool] = None


def register_geofence_routes(app: FastAPI) -> None:

    @app.get("/app/geofences")
    def list_geofences(client_id: str):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, name, type, center_lat, center_lng, radius_m,
                       polygon, active, alert_enter, alert_exit, created_at
                FROM geofences WHERE client_id = %s ORDER BY created_at DESC
            """, (client_id,))
            return {"geofences": [dict(r) for r in cur.fetchall()]}

    @app.post("/app/geofences")
    def create_geofence(body: GeofenceCreate):
        gf_id = str(uuid.uuid4())
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO geofences
                    (id, client_id, name, type, center_lat, center_lng,
                     radius_m, polygon, alert_enter, alert_exit, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (gf_id, body.client_id, body.name, body.type,
                  body.center_lat, body.center_lng, body.radius_m,
                  json.dumps(body.polygon) if body.polygon else None,
                  body.alert_enter, body.alert_exit,
                  datetime.utcnow().isoformat()))
        return {"ok": True, "id": gf_id}

    @app.put("/app/geofences/{gf_id}")
    def update_geofence(gf_id: str, body: GeofenceUpdate):
        fields, vals = [], []
        for field, val in body.model_dump(exclude_unset=True).items():
            if field == "polygon" and val is not None:
                val = json.dumps(val)
            fields.append(f"{field} = %s"); vals.append(val)
        if not fields:
            raise HTTPException(status_code=400, detail="Nada que actualizar")
        vals.append(gf_id)
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(f"UPDATE geofences SET {', '.join(fields)} WHERE id = %s", vals)
        return {"ok": True}

    @app.delete("/app/geofences/{gf_id}")
    def delete_geofence(gf_id: str):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM geofences WHERE id = %s", (gf_id,))
        return {"ok": True}

    @app.get("/app/geofences/events")
    def geofence_events(vehicle_id: str, limit: int = 50):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT e.id, e.event_type, e.lat, e.lng, e.created_at,
                       g.name as geofence_name
                FROM geofence_events e
                JOIN geofences g ON g.id = e.geofence_id
                WHERE e.vehicle_id = %s
                ORDER BY e.created_at DESC LIMIT %s
            """, (vehicle_id, limit))
            return {"events": [dict(r) for r in cur.fetchall()]}

    @app.get("/app/alert-contacts")
    def list_contacts(client_id: str):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, name, whatsapp, email, active, created_at
                FROM alert_contacts WHERE client_id = %s ORDER BY created_at ASC
            """, (client_id,))
            return {"contacts": [dict(r) for r in cur.fetchall()]}

    @app.post("/app/alert-contacts")
    def create_contact(body: dict):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO alert_contacts (client_id, name, whatsapp, email, created_at)
                VALUES (%s,%s,%s,%s,%s) RETURNING id
            """, (body["client_id"], body["name"], body.get("whatsapp"),
                  body.get("email"), datetime.utcnow().isoformat()))
            row = cur.fetchone()
        return {"ok": True, "id": row["id"]}

    @app.delete("/app/alert-contacts/{contact_id}")
    def delete_contact(contact_id: int):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM alert_contacts WHERE id = %s", (contact_id,))
        return {"ok": True}


# ── Función interna llamada desde gps_update_routes ───────────
async def check_geofences(vehicle_id: str, client_id: str, lat: float, lng: float) -> list[str]:
    alerts = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, type, center_lat, center_lng, radius_m,
                   polygon, alert_enter, alert_exit
            FROM geofences WHERE client_id = %s AND active = TRUE
        """, (client_id,))
        geofences = [dict(r) for r in cur.fetchall()]

        for gf in geofences:
            inside = _is_inside(gf, lat, lng)
            cur.execute("""
                SELECT event_type FROM geofence_events
                WHERE geofence_id = %s AND vehicle_id = %s
                ORDER BY created_at DESC LIMIT 1
            """, (gf["id"], vehicle_id))
            last = cur.fetchone()
            last_type = last["event_type"] if last else None

            event = None
            if inside and last_type != "enter" and gf["alert_enter"]:
                event = "enter"
                alerts.append(f"📍 *GEOCERCA* Vehículo entró en: {gf['name']}")
            elif not inside and last_type == "enter" and gf["alert_exit"]:
                event = "exit"
                alerts.append(f"📍 *GEOCERCA* Vehículo salió de: {gf['name']}")

            if event:
                cur.execute("""
                    INSERT INTO geofence_events
                        (geofence_id, vehicle_id, event_type, lat, lng, created_at)
                    VALUES (%s,%s,%s,%s,%s,%s)
                """, (gf["id"], vehicle_id, event, lat, lng, datetime.utcnow().isoformat()))
    return alerts


def _is_inside(gf, lat, lng):
    if gf["type"] == "circle" and gf["center_lat"] and gf["radius_m"]:
        return _dist(lat, lng, gf["center_lat"], gf["center_lng"]) <= gf["radius_m"]
    if gf["type"] == "polygon" and gf["polygon"]:
        pts = gf["polygon"] if isinstance(gf["polygon"], list) else json.loads(gf["polygon"])
        return _pip(lat, lng, pts)
    return False

def _dist(lat1,lng1,lat2,lng2):
    R=6371000; φ1,φ2=math.radians(lat1),math.radians(lat2)
    dφ=math.radians(lat2-lat1); dλ=math.radians(lng2-lng1)
    a=math.sin(dφ/2)**2+math.cos(φ1)*math.cos(φ2)*math.sin(dλ/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

def _pip(lat,lng,poly):
    n=len(poly); inside=False; j=n-1
    for i in range(n):
        xi,yi=poly[i]["lng"],poly[i]["lat"]
        xj,yj=poly[j]["lng"],poly[j]["lat"]
        if ((yi>lat)!=(yj>lat)) and (lng<(xj-xi)*(lat-yi)/(yj-yi)+xi):
            inside=not inside
        j=i
    return inside