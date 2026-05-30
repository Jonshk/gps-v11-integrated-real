"""
alerts_routes.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/alerts_routes.py  (CREAR)

Endpoints:
  GET  /app/alerts/log          — historial de alertas del cliente
  POST /app/alerts/resolve/{id} — marcar alerta como resuelta
  GET  /app/odometer/monthly    — km por vehículo por mes
  GET  /app/odometer/summary    — resumen total de flota
  POST /app/drivers             — crear cuenta de conductor
  GET  /app/drivers             — listar conductores
  POST /app/drivers/login       — login del conductor
"""
from __future__ import annotations
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta
from app.db import get_conn
import uuid, math


def register_alerts_routes(app: FastAPI) -> None:

    # ──────────────────────────────────────────────────────────
    #  ALERTAS LOG
    # ──────────────────────────────────────────────────────────

    @app.get("/app/alerts/log")
    def get_alerts_log(
        client_id: str,
        days: int = Query(7, ge=1, le=30),
        alert_type: Optional[str] = None,   # speed | battery | geofence | all
        vehicle_id: Optional[str] = None,
        limit: int = Query(100, ge=1, le=500),
    ):
        since = (datetime.utcnow() - timedelta(days=days)).isoformat()
        with get_conn() as conn:
            cur = conn.cursor()
            conditions = ["client_id = %s", "created_at >= %s"]
            params: list = [client_id, since]
            if alert_type and alert_type != "all":
                conditions.append("alert_type = %s"); params.append(alert_type)
            if vehicle_id:
                conditions.append("vehicle_id = %s"); params.append(vehicle_id)
            params.append(limit)
            cur.execute(f"""
                SELECT id, vehicle_id, vehicle_name, alert_type, message,
                       lat, lng, speed, battery, resolved, created_at
                FROM alerts_log
                WHERE {' AND '.join(conditions)}
                ORDER BY created_at DESC
                LIMIT %s
            """, params)
            alerts = [dict(r) for r in cur.fetchall()]

        # Resumen por tipo
        summary = {"speed": 0, "battery": 0, "geofence": 0, "total": len(alerts)}
        for a in alerts:
            t = a.get("alert_type", "")
            if t in summary: summary[t] += 1

        return {"alerts": alerts, "summary": summary}

    @app.post("/app/alerts/resolve/{alert_id}")
    def resolve_alert(alert_id: int):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE alerts_log SET resolved=TRUE WHERE id=%s", (alert_id,))
        return {"ok": True}

    @app.delete("/app/alerts/log")
    def clear_alerts(client_id: str):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "DELETE FROM alerts_log WHERE client_id=%s AND resolved=TRUE",
                (client_id,)
            )
        return {"ok": True}

    # ──────────────────────────────────────────────────────────
    #  ODÓMETRO
    # ──────────────────────────────────────────────────────────

    @app.get("/app/odometer/monthly")
    def odometer_monthly(
        client_id: str,
        vehicle_id: Optional[str] = None,
        months: int = Query(3, ge=1, le=12),
    ):
        """Km por vehículo agrupados por mes."""
        since = (date.today().replace(day=1) - timedelta(days=months*30)).isoformat()
        with get_conn() as conn:
            cur = conn.cursor()

            # Obtener vehículos del cliente
            if vehicle_id:
                cur.execute("SELECT id, name, plate FROM vehicles WHERE id=%s", (vehicle_id,))
            else:
                cur.execute("""
                    SELECT v.id, v.name, v.plate FROM vehicles v
                    JOIN app_clients c ON c.vehicle_id = v.id
                    WHERE c.id = %s
                    UNION
                    SELECT v.id, v.name, v.plate FROM vehicles v
                    JOIN gps_devices d ON d.vehicle_id = v.id
                    JOIN app_clients c ON c.gps_device_id = d.id
                    WHERE c.id = %s
                """, (client_id, client_id))
            vehicles = [dict(r) for r in cur.fetchall()]

            result = []
            for v in vehicles:
                cur.execute("""
                    SELECT
                        TO_CHAR(date, 'YYYY-MM') as month,
                        SUM(km)          as total_km,
                        MAX(max_speed)   as max_speed,
                        SUM(active_min)  as active_min
                    FROM odometer_daily
                    WHERE vehicle_id = %s AND date >= %s::date
                    GROUP BY TO_CHAR(date, 'YYYY-MM')
                    ORDER BY month DESC
                """, (v["id"], since))
                months_data = [dict(r) for r in cur.fetchall()]

                # Total acumulado
                total = sum(m["total_km"] or 0 for m in months_data)

                result.append({
                    "vehicle_id":   v["id"],
                    "vehicle_name": v["name"],
                    "plate":        v["plate"] or "",
                    "total_km":     round(total, 1),
                    "months":       [
                        {
                            "month":      m["month"],
                            "km":         round(m["total_km"] or 0, 1),
                            "max_speed":  round(m["max_speed"] or 0, 1),
                            "active_min": m["active_min"] or 0,
                        }
                        for m in months_data
                    ],
                })

        return {"vehicles": result}

    @app.get("/app/odometer/summary")
    def odometer_summary(client_id: str):
        """Resumen rápido: km del mes actual y mes anterior por vehículo."""
        today      = date.today()
        this_month = today.replace(day=1).isoformat()
        last_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1).isoformat()

        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT v.id, v.name, v.plate,
                    COALESCE(SUM(CASE WHEN o.date >= %s::date THEN o.km END), 0) as this_month_km,
                    COALESCE(SUM(CASE WHEN o.date >= %s::date AND o.date < %s::date THEN o.km END), 0) as last_month_km,
                    COALESCE(SUM(o.km), 0) as total_km
                FROM vehicles v
                LEFT JOIN odometer_daily o ON o.vehicle_id = v.id
                WHERE v.id IN (
                    SELECT vehicle_id FROM app_clients WHERE id=%s AND vehicle_id IS NOT NULL
                    UNION
                    SELECT d.vehicle_id FROM gps_devices d
                    JOIN app_clients c ON c.gps_device_id = d.id WHERE c.id=%s AND d.vehicle_id IS NOT NULL
                )
                GROUP BY v.id, v.name, v.plate
                ORDER BY v.name
            """, (this_month, last_month, this_month, client_id, client_id))
            rows = [dict(r) for r in cur.fetchall()]

        return {
            "vehicles": [
                {
                    "vehicle_id":     r["id"],
                    "vehicle_name":   r["name"],
                    "plate":          r["plate"] or "",
                    "this_month_km":  round(r["this_month_km"] or 0, 1),
                    "last_month_km":  round(r["last_month_km"] or 0, 1),
                    "total_km":       round(r["total_km"] or 0, 1),
                }
                for r in rows
            ]
        }

    # ──────────────────────────────────────────────────────────
    #  CONDUCTORES
    # ──────────────────────────────────────────────────────────

    class DriverCreate(BaseModel):
        client_id: str
        vehicle_id: Optional[str] = None
        name: str
        username: str
        password: str

    class DriverLogin(BaseModel):
        username: str
        password: str

    @app.get("/app/drivers")
    def list_drivers(client_id: str):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT d.id, d.name, d.username, d.active, d.created_at,
                       v.name as vehicle_name, v.plate
                FROM driver_accounts d
                LEFT JOIN vehicles v ON v.id = d.vehicle_id
                WHERE d.client_id = %s ORDER BY d.created_at DESC
            """, (client_id,))
            return {"drivers": [dict(r) for r in cur.fetchall()]}

    @app.post("/app/drivers")
    def create_driver(body: DriverCreate):
        from app.security import hash_password
        did = f"drv-{uuid.uuid4().hex[:8]}"
        with get_conn() as conn:
            cur = conn.cursor()
            # Verificar username único
            cur.execute("SELECT id FROM driver_accounts WHERE username=%s", (body.username,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Ese usuario ya existe")
            cur.execute("""
                INSERT INTO driver_accounts
                    (id, client_id, vehicle_id, name, username, password, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (did, body.client_id, body.vehicle_id, body.name,
                  body.username, hash_password(body.password),
                  datetime.utcnow().isoformat()))
        return {"ok": True, "id": did}

    @app.delete("/app/drivers/{driver_id}")
    def delete_driver(driver_id: str):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM driver_accounts WHERE id=%s", (driver_id,))
        return {"ok": True}

    @app.post("/app/drivers/login")
    def driver_login(body: DriverLogin):
        from app.security import verify_password
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT d.*, v.id as vid, v.name as vname, v.plate,
                       v.lat, v.lng, v.speed, v.status, v.updated_at
                FROM driver_accounts d
                LEFT JOIN vehicles v ON v.id = d.vehicle_id
                WHERE d.username=%s AND d.active=TRUE
            """, (body.username,))
            row = cur.fetchone()
        if not row or not verify_password(body.password, row["password"]):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        return {
            "ok":           True,
            "driver_id":    row["id"],
            "driver_name":  row["name"],
            "vehicle_id":   row["vid"],
            "vehicle_name": row["vname"] or "",
            "plate":        row["plate"] or "",
            "lat":          row["lat"],
            "lng":          row["lng"],
            "speed":        row["speed"],
            "status":       row["status"],
            "updated_at":   row["updated_at"],
        }

    @app.get("/app/drivers/{driver_id}/today")
    def driver_today(driver_id: str):
        """Resumen del día del conductor — para el panel del conductor."""
        today = date.today().isoformat()
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT d.vehicle_id, d.name as driver_name,
                       v.name as vehicle_name, v.plate,
                       v.lat, v.lng, v.speed, v.status, v.updated_at
                FROM driver_accounts d
                LEFT JOIN vehicles v ON v.id = d.vehicle_id
                WHERE d.id = %s
            """, (driver_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404)

            # Odómetro de hoy
            cur.execute("""
                SELECT km, max_speed, active_min
                FROM odometer_daily
                WHERE vehicle_id=%s AND date=%s::date
            """, (row["vehicle_id"], today))
            odo = cur.fetchone()

            # Alertas de hoy
            cur.execute("""
                SELECT alert_type, message, created_at
                FROM alerts_log
                WHERE vehicle_id=%s AND DATE(created_at)=%s::date
                ORDER BY created_at DESC LIMIT 10
            """, (row["vehicle_id"], today))
            alerts = [dict(r) for r in cur.fetchall()]

        return {
            "driver_name":  row["driver_name"],
            "vehicle_name": row["vehicle_name"],
            "plate":        row["plate"] or "",
            "lat":          row["lat"],
            "lng":          row["lng"],
            "speed":        row["speed"],
            "status":       row["status"],
            "updated_at":   row["updated_at"],
            "today_km":     round(odo["km"] if odo else 0, 1),
            "today_max_speed": round(odo["max_speed"] if odo else 0, 1),
            "today_active_min": odo["active_min"] if odo else 0,
            "today_alerts": alerts,
        }