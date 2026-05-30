"""
gps_update_routes.py  (con logs estructurados)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/gps_update_routes.py  (REEMPLAZAR)

Cambios vs anterior:
- Usa log_gps_update / log_alert / capture_exception de logger.py
- manager.publish() en vez de manager.send() para Redis
"""
from __future__ import annotations
from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from app.db import get_conn
from app.ws_manager import manager
from app.security import check_rate_limit, get_client_ip
from app.logger import log_gps_update, log_alert, capture_exception
import os, math, logging, httpx

logger = logging.getLogger(__name__)

MIN_DIST_METERS = 5

class GPSPayload(BaseModel):
    sim_number: str
    lat: float
    lng: float
    speed: float   = 0.0
    heading: float = 0.0
    battery: float = 100.0
    timestamp: Optional[str] = None


def register_gps_update_routes(app: FastAPI) -> None:

    @app.post("/gps/update")
    async def receive_position(
        payload: GPSPayload,
        request: Request,
        x_gps_secret: str | None = Header(default=None),
    ):
        check_rate_limit(get_client_ip(request), "/gps/update")

        from app.config import GPS_UPDATE_SECRET
        if not GPS_UPDATE_SECRET or x_gps_secret != GPS_UPDATE_SECRET:
            raise HTTPException(status_code=401, detail="Unauthorized")

        now    = payload.timestamp or datetime.utcnow().isoformat()
        today  = date.today().isoformat()
        status = "active" if payload.speed > 2 else "idle"

        try:
            with get_conn() as conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT c.id as client_id, c.account_type, c.whatsapp_phone,
                           v.id as vehicle_id, v.name as vehicle_name,
                           v.plate, v.speed_limit,
                           v.lat as prev_lat, v.lng as prev_lng
                    FROM app_clients c
                    JOIN gps_devices d ON c.gps_device_id = d.id
                    JOIN vehicles    v ON c.vehicle_id    = v.id
                    WHERE d.sim_number=%s AND c.active=TRUE
                """, (payload.sim_number,))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="SIM no encontrada")

                client_id  = row["client_id"]
                vehicle_id = row["vehicle_id"]
                prev_lat   = row["prev_lat"]
                prev_lng   = row["prev_lng"]

                cur.execute("""
                    UPDATE vehicles SET lat=%s,lng=%s,speed=%s,heading=%s,
                        battery=%s,status=%s,updated_at=%s WHERE id=%s
                """, (payload.lat,payload.lng,payload.speed,payload.heading,
                      payload.battery,status,now,vehicle_id))

                cur.execute("""
                    INSERT INTO positions
                        (vehicle_id,lat,lng,speed,heading,battery,event_type,created_at)
                    VALUES (%s,%s,%s,%s,%s,%s,'position',%s)
                """, (vehicle_id,payload.lat,payload.lng,payload.speed,
                      payload.heading,payload.battery,now))

                cur.execute("""
                    INSERT INTO gps_positions
                        (client_id,from_number,lat,lng,speed,battery,recorded_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s)
                """, (client_id,payload.sim_number,payload.lat,payload.lng,
                      payload.speed,payload.battery,now))

                # Odómetro
                dist_km = 0.0
                if prev_lat and prev_lng:
                    dist_m = _haversine_m(prev_lat,prev_lng,payload.lat,payload.lng)
                    if dist_m >= MIN_DIST_METERS:
                        dist_km = dist_m / 1000

                if dist_km > 0 or status == "active":
                    cur.execute("""
                        INSERT INTO odometer_daily (vehicle_id,date,km,max_speed,active_min,updated_at)
                        VALUES (%s,%s::date,%s,%s,0,NOW())
                        ON CONFLICT (vehicle_id,date) DO UPDATE SET
                            km        = odometer_daily.km + EXCLUDED.km,
                            max_speed = GREATEST(odometer_daily.max_speed, EXCLUDED.max_speed),
                            active_min = odometer_daily.active_min + CASE WHEN %s>2 THEN 1 ELSE 0 END,
                            updated_at = NOW()
                    """, (vehicle_id,today,dist_km,payload.speed,payload.speed))

        except HTTPException: raise
        except Exception as e:
            capture_exception(e, {"sim": payload.sim_number, "lat": payload.lat, "lng": payload.lng})
            raise HTTPException(status_code=500, detail="Error procesando posición")

        # ── Broadcast WebSocket via Redis ──────────────────────
        data = {
            "type":"position_update","sim_number":payload.sim_number,
            "vehicle_id":vehicle_id,"vehicle_name":row["vehicle_name"],
            "plate":row["plate"] or "","lat":payload.lat,"lng":payload.lng,
            "speed":payload.speed,"heading":payload.heading,"battery":payload.battery,
            "status":status,"timestamp":now,
        }
        # publish() usa Redis si está configurado, send() local si no
        await manager.publish(f"vehicle_{vehicle_id}_{client_id}", data)
        if row["account_type"] == "fleet":
            await manager.publish(f"fleet_{client_id}", data)

        # ── Alertas ────────────────────────────────────────────
        alerts: list[dict] = []
        limit = row["speed_limit"] or 120
        if payload.speed > limit:
            msg = f"🚨 *VELOCIDAD* {row['vehicle_name']} ({row['plate']}): {payload.speed:.0f} km/h (límite {limit:.0f})"
            alerts.append({"type":"speed","message":msg})
            log_alert(client_id, row["vehicle_name"], "speed", msg)

        if payload.battery < 20:
            msg = f"🔋 *BATERÍA BAJA* {row['vehicle_name']}: {payload.battery:.0f}%"
            alerts.append({"type":"battery","message":msg})
            log_alert(client_id, row["vehicle_name"], "battery", msg)

        from app.geofence_routes import check_geofences
        geo_msgs = await check_geofences(vehicle_id, client_id, payload.lat, payload.lng)
        for m in geo_msgs:
            alerts.append({"type":"geofence","message":m})
            log_alert(client_id, row["vehicle_name"], "geofence", m)

        # Guardar alertas + notificar
        if alerts:
            try:
                with get_conn() as conn:
                    cur = conn.cursor()
                    for a in alerts:
                        cur.execute("""
                            INSERT INTO alerts_log
                                (client_id,vehicle_id,vehicle_name,alert_type,
                                 message,lat,lng,speed,battery,created_at)
                            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        """, (client_id,vehicle_id,row["vehicle_name"],
                              a["type"],a["message"],
                              payload.lat,payload.lng,payload.speed,payload.battery,now))
            except Exception as e:
                capture_exception(e, {"context":"alerts_log"})

            all_msgs = [a["message"] for a in alerts]
            await _notify(client_id, row["whatsapp_phone"], all_msgs)
            for msg in all_msgs:
                pkt = {"type":"alert","message":msg,"vehicle_id":vehicle_id,"timestamp":now}
                await manager.publish(f"vehicle_{vehicle_id}_{client_id}", pkt)
                await manager.publish(f"fleet_{client_id}", pkt)

        # ── Log estructurado ───────────────────────────────────
        log_gps_update(payload.sim_number, payload.lat, payload.lng,
                       payload.speed, dist_km, len(alerts))

        return {"ok": True, "km_added": round(dist_km, 4), "alerts": len(alerts)}


async def _notify(client_id, main_phone, messages):
    api_key = os.getenv("CALLMEBOT_API_KEY","")
    if not api_key: return
    phones = [main_phone] if main_phone else []
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT whatsapp FROM alert_contacts
                WHERE client_id=%s AND active=TRUE AND whatsapp IS NOT NULL
            """, (client_id,))
            phones += [r["whatsapp"] for r in cur.fetchall()]
        except Exception: pass
    text = "\n".join(messages)
    async with httpx.AsyncClient() as http:
        for phone in set(p for p in phones if p):
            try:
                await http.get(
                    f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={text}&apikey={api_key}",
                    timeout=5)
            except Exception as e:
                logger.warning(f"[WA] {phone}: {e}")


def _haversine_m(lat1,lng1,lat2,lng2):
    R=6371000; f1,f2=math.radians(lat1),math.radians(lat2)
    df=math.radians(lat2-lat1); dl=math.radians(lng2-lng1)
    a=math.sin(df/2)**2+math.cos(f1)*math.cos(f2)*math.sin(dl/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))