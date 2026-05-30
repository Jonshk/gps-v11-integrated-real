"""
migrate_funcionalidad.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en:   Backend/  (raíz)
Correr:  python migrate_funcionalidad.py
Borrar después.

Añade:
- Tabla alerts_log       (historial de alertas con timestamp/ubicación)
- Tabla odometer_daily   (km acumulados por vehículo por día)
- Tabla driver_accounts  (cuentas simplificadas para conductores)
"""
from __future__ import annotations
import os
from dotenv import load_dotenv
load_dotenv()
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("❌  DATABASE_URL no encontrado en .env")

MIGRATIONS = [
    # ── Historial de alertas ──────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS alerts_log (
        id          SERIAL PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES app_clients(id),
        vehicle_id  TEXT REFERENCES vehicles(id),
        vehicle_name TEXT,
        alert_type  TEXT NOT NULL,
        message     TEXT NOT NULL,
        lat         REAL,
        lng         REAL,
        speed       REAL,
        battery     REAL,
        resolved    BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_alerts_log_client   ON alerts_log(client_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_alerts_log_vehicle  ON alerts_log(vehicle_id, created_at DESC)",

    # ── Odómetro diario ───────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS odometer_daily (
        id          SERIAL PRIMARY KEY,
        vehicle_id  TEXT NOT NULL REFERENCES vehicles(id),
        date        DATE NOT NULL,
        km          REAL NOT NULL DEFAULT 0,
        max_speed   REAL DEFAULT 0,
        active_min  INTEGER DEFAULT 0,
        updated_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(vehicle_id, date)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_odometer_vehicle_date ON odometer_daily(vehicle_id, date DESC)",

    # ── Cuentas de conductor ──────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS driver_accounts (
        id          TEXT PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES app_clients(id),
        vehicle_id  TEXT REFERENCES vehicles(id),
        name        TEXT NOT NULL,
        username    TEXT NOT NULL UNIQUE,
        password    TEXT NOT NULL,
        active      BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_drivers_client ON driver_accounts(client_id)",
]

def run():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        cur = conn.cursor()
        for sql in MIGRATIONS:
            label = sql.strip()[:65].replace("\n", " ")
            try:
                cur.execute(sql.strip()); conn.commit()
                print(f"✅  {label}")
            except Exception as e:
                conn.rollback()
                print(f"⚠️   {label}  → {e}")
        print("\n✅  Migración funcionalidad completada.")
    finally:
        conn.close()

if __name__ == "__main__":
    run()