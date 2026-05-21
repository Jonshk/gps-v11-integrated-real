from __future__ import annotations
import uuid
from app.db import get_conn
from app.utils import now_iso, random_shift

# ── Vehicles ──────────────────────────────────────────────────────────────

def get_all_vehicles() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM vehicles ORDER BY updated_at DESC")
        return [dict(r) for r in cur.fetchall()]

def get_vehicle(vehicle_id: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM vehicles WHERE id = %s", (vehicle_id,))
        row = cur.fetchone()
        return dict(row) if row else None

def create_vehicle(data: dict) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO vehicles (id, name, status, lat, lng, speed, geofence, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["id"], data["name"], data.get("status", "idle"),
            data.get("lat", 0), data.get("lng", 0),
            data.get("speed", 0), data.get("geofence"),
            now_iso(),
        ))
    return get_vehicle(data["id"])

def update_vehicle(vehicle_id: str, data: dict) -> dict | None:
    v = get_vehicle(vehicle_id)
    if not v:
        return None
    merged = {**v, **data}
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE vehicles SET name=%s, status=%s, lat=%s, lng=%s,
            speed=%s, geofence=%s, updated_at=%s WHERE id=%s
        """, (
            merged["name"], merged["status"], merged["lat"], merged["lng"],
            merged["speed"], merged.get("geofence"), now_iso(), vehicle_id,
        ))
    return get_vehicle(vehicle_id)

def delete_vehicle(vehicle_id: str) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM vehicles WHERE id = %s", (vehicle_id,))
        return cur.rowcount > 0

def add_position(vehicle_id: str, lat: float, lng: float, speed: float, geofence: str | None) -> dict | None:
    v = get_vehicle(vehicle_id)
    if not v:
        return None
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO positions (vehicle_id, lat, lng, speed, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (vehicle_id, lat, lng, speed, now_iso()))
        cur.execute("""
            UPDATE vehicles SET lat=%s, lng=%s, speed=%s, geofence=%s, updated_at=%s
            WHERE id=%s
        """, (lat, lng, speed, geofence, now_iso(), vehicle_id))
    return get_vehicle(vehicle_id)

def get_positions(vehicle_id: str, limit: int = 20) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM positions WHERE vehicle_id = %s
            ORDER BY created_at DESC LIMIT %s
        """, (vehicle_id, limit))
        return [dict(r) for r in cur.fetchall()]

# ── Alerts ────────────────────────────────────────────────────────────────

def get_alerts(limit: int = 20) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT %s", (limit,))
        return [dict(r) for r in cur.fetchall()]

def create_alert(data: dict) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO alerts (id, type, message, created_at, severity)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            data.get("id", str(uuid.uuid4())),
            data["type"], data["message"],
            now_iso(), data.get("severity", "low"),
        ))
    return data

# ── Metrics ───────────────────────────────────────────────────────────────

def get_metrics() -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT status, COUNT(*) as n FROM vehicles GROUP BY status")
        rows = {r["status"]: r["n"] for r in cur.fetchall()}
        cur.execute("SELECT COUNT(*) as n FROM alerts WHERE created_at > %s", (now_iso()[:10],))
        alert_count = cur.fetchone()["n"]
    return {
        "active":  rows.get("active", 0),
        "idle":    rows.get("idle", 0),
        "offline": rows.get("offline", 0),
        "alerts":  alert_count,
        "routes":  rows.get("active", 0),
    }

# ── Seed ──────────────────────────────────────────────────────────────────

def seed_if_empty() -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as n FROM vehicles")
        if cur.fetchone()["n"] > 0:
            return

    seed_vehicles = [
        {"id": "veh-1", "name": "ECU-204", "status": "active",  "lat": -2.1704, "lng": -79.8895, "speed": 62,  "geofence": "Zona centro"},
        {"id": "veh-2", "name": "ECU-107", "status": "idle",    "lat": -2.1550, "lng": -79.9012, "speed": 0,   "geofence": "Zona norte"},
        {"id": "veh-3", "name": "ECU-301", "status": "offline", "lat": -2.1842, "lng": -79.8763, "speed": 0,   "geofence": None},
    ]
    for v in seed_vehicles:
        create_vehicle(v)
