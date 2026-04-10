from __future__ import annotations

from app.db import get_conn
from app.utils import now_iso

def seed_if_empty() -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        total = cur.execute("SELECT COUNT(*) AS total FROM vehicles").fetchone()["total"]
        if total > 0:
            return

        created_at = now_iso()
        vehicles = [
            ("veh-1", "ECU-204", "active", -2.1704, -79.8895, 62, "Zona centro", created_at),
            ("veh-2", "ECU-107", "idle", -2.1550, -79.9012, 0, "Zona norte", created_at),
            ("veh-3", "ECU-301", "offline", -2.1842, -79.8763, 0, None, created_at),
        ]
        cur.executemany(
            "INSERT INTO vehicles (id, name, status, lat, lng, speed, geofence, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            vehicles,
        )

        for vehicle in vehicles:
            cur.execute(
                "INSERT INTO positions (vehicle_id, lat, lng, speed, created_at) VALUES (?, ?, ?, ?, ?)",
                (vehicle[0], vehicle[3], vehicle[4], vehicle[5], created_at),
            )

        alerts = [
            ("alert-1", "movement", "Movimiento detectado", created_at, "medium"),
            ("alert-2", "geofence", "Ingreso a geocerca", created_at, "low"),
        ]
        cur.executemany(
            "INSERT INTO alerts (id, type, message, created_at, severity) VALUES (?, ?, ?, ?, ?)",
            alerts,
        )

def get_all_vehicles() -> list[dict]:
    with get_conn() as conn:
        return conn.cursor().execute("SELECT * FROM vehicles ORDER BY updated_at DESC, name ASC").fetchall()

def get_vehicle(vehicle_id: str) -> dict | None:
    with get_conn() as conn:
        return conn.cursor().execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,)).fetchone()

def create_vehicle(payload: dict) -> dict:
    data = {**payload, "updated_at": now_iso()}
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO vehicles (id, name, status, lat, lng, speed, geofence, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (data["id"], data["name"], data["status"], data["lat"], data["lng"], data["speed"], data.get("geofence"), data["updated_at"]),
        )
        cur.execute(
            "INSERT INTO positions (vehicle_id, lat, lng, speed, created_at) VALUES (?, ?, ?, ?, ?)",
            (data["id"], data["lat"], data["lng"], data["speed"], data["updated_at"]),
        )
    return get_vehicle(data["id"])

def update_vehicle(vehicle_id: str, payload: dict) -> dict | None:
    current = get_vehicle(vehicle_id)
    if not current:
        return None
    merged = {**current, **{k: v for k, v in payload.items() if v is not None}, "updated_at": now_iso()}
    with get_conn() as conn:
        conn.cursor().execute(
            "UPDATE vehicles SET name = ?, status = ?, lat = ?, lng = ?, speed = ?, geofence = ?, updated_at = ? WHERE id = ?",
            (merged["name"], merged["status"], merged["lat"], merged["lng"], merged["speed"], merged.get("geofence"), merged["updated_at"], vehicle_id),
        )
    return get_vehicle(vehicle_id)

def delete_vehicle(vehicle_id: str) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM positions WHERE vehicle_id = ?", (vehicle_id,))
        cur.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
        return cur.rowcount > 0

def add_position(vehicle_id: str, lat: float, lng: float, speed: float, geofence: str | None) -> dict | None:
    vehicle = get_vehicle(vehicle_id)
    if not vehicle:
        return None
    created_at = now_iso()
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO positions (vehicle_id, lat, lng, speed, created_at) VALUES (?, ?, ?, ?, ?)",
            (vehicle_id, lat, lng, speed, created_at),
        )
        cur.execute(
            "UPDATE vehicles SET lat = ?, lng = ?, speed = ?, geofence = ?, updated_at = ?, status = ? WHERE id = ?",
            (lat, lng, speed, geofence, created_at, "active" if speed > 0 else "idle", vehicle_id),
        )
    return get_vehicle(vehicle_id)

def get_positions(vehicle_id: str, limit: int = 20) -> list[dict]:
    with get_conn() as conn:
        return conn.cursor().execute(
            "SELECT * FROM positions WHERE vehicle_id = ? ORDER BY id DESC LIMIT ?",
            (vehicle_id, limit),
        ).fetchall()

def get_alerts(limit: int = 20) -> list[dict]:
    with get_conn() as conn:
        return conn.cursor().execute(
            "SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()

def create_alert(payload: dict) -> dict:
    created_at = now_iso()
    with get_conn() as conn:
        conn.cursor().execute(
            "INSERT INTO alerts (id, type, message, created_at, severity) VALUES (?, ?, ?, ?, ?)",
            (payload["id"], payload["type"], payload["message"], created_at, payload["severity"]),
        )
    with get_conn() as conn:
        return conn.cursor().execute("SELECT * FROM alerts WHERE id = ?", (payload["id"],)).fetchone()

def get_metrics() -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        active = cur.execute("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'active'").fetchone()["total"]
        idle = cur.execute("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'idle'").fetchone()["total"]
        offline = cur.execute("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'offline'").fetchone()["total"]
        alerts = cur.execute("SELECT COUNT(*) AS total FROM alerts").fetchone()["total"]
        routes = cur.execute("SELECT COUNT(*) AS total FROM positions").fetchone()["total"]
        return {"active": active, "idle": idle, "offline": offline, "alerts": alerts, "routes": routes}
