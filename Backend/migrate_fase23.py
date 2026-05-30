"""
migrate_fase23.py
Corre UNA SOLA VEZ desde D:\APK\gps-v11-integrated-real\Backend\
  python migrate_fase23.py

Añade columnas y tablas nuevas sin tocar nada existente.
"""
from __future__ import annotations
import os, secrets
from dotenv import load_dotenv
load_dotenv()

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.ibojygwdtrrcwsguboak:Caracas2026**@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"
)

MIGRATIONS = [
    # ── app_clients: columnas nuevas ─────────────────────────
    "ALTER TABLE app_clients ADD COLUMN IF NOT EXISTS ws_token        TEXT",
    "ALTER TABLE app_clients ADD COLUMN IF NOT EXISTS account_type    TEXT DEFAULT 'individual'",
    "ALTER TABLE app_clients ADD COLUMN IF NOT EXISTS whatsapp_phone  TEXT",

    # ── vehicles: columnas nuevas ────────────────────────────
    "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS heading   REAL DEFAULT 0",
    "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery   REAL DEFAULT 100",
    "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS plate     TEXT",
    "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS speed_limit REAL DEFAULT 120",

    # ── positions: columnas nuevas ───────────────────────────
    "ALTER TABLE positions ADD COLUMN IF NOT EXISTS heading    REAL DEFAULT 0",
    "ALTER TABLE positions ADD COLUMN IF NOT EXISTS battery    REAL DEFAULT 100",
    "ALTER TABLE positions ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'position'",

    # ── Historial de rutas ───────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS route_history (
        id          SERIAL PRIMARY KEY,
        vehicle_id  TEXT NOT NULL REFERENCES vehicles(id),
        date        DATE NOT NULL,
        start_time  TIMESTAMPTZ,
        end_time    TIMESTAMPTZ,
        total_km    REAL DEFAULT 0,
        max_speed   REAL DEFAULT 0,
        avg_speed   REAL DEFAULT 0,
        stop_count  INTEGER DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_route_history_vehicle_date ON route_history(vehicle_id, date)",

    # ── Geocercas ────────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS geofences (
        id          TEXT PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES app_clients(id),
        name        TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'circle',
        center_lat  REAL,
        center_lng  REAL,
        radius_m    REAL,
        polygon     JSONB,
        active      BOOLEAN DEFAULT TRUE,
        alert_enter BOOLEAN DEFAULT TRUE,
        alert_exit  BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_geofences_client ON geofences(client_id)",

    # ── Eventos de geocerca ───────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS geofence_events (
        id          SERIAL PRIMARY KEY,
        geofence_id TEXT NOT NULL REFERENCES geofences(id),
        vehicle_id  TEXT NOT NULL REFERENCES vehicles(id),
        event_type  TEXT NOT NULL,
        lat         REAL,
        lng         REAL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,

    # ── Push tokens ───────────────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS push_tokens (
        id          SERIAL PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES app_clients(id),
        token       TEXT NOT NULL UNIQUE,
        platform    TEXT DEFAULT 'android',
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,

    # ── Contactos de alerta ───────────────────────────────────
    """
    CREATE TABLE IF NOT EXISTS alert_contacts (
        id          SERIAL PRIMARY KEY,
        client_id   TEXT NOT NULL REFERENCES app_clients(id),
        name        TEXT NOT NULL,
        whatsapp    TEXT,
        email       TEXT,
        active      BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
    )
    """,
]


def run():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        cur = conn.cursor()
        for sql in MIGRATIONS:
            sql = sql.strip()
            label = sql[:70].replace("\n", " ")
            try:
                cur.execute(sql)
                conn.commit()
                print(f"✅  {label}")
            except Exception as e:
                conn.rollback()
                print(f"⚠️   {label}  →  {e}")

        # Generar ws_token para clientes existentes
        cur.execute("SELECT id FROM app_clients WHERE ws_token IS NULL")
        rows = cur.fetchall()
        for row in rows:
            token = secrets.token_urlsafe(32)
            cur.execute("UPDATE app_clients SET ws_token = %s WHERE id = %s", (token, row["id"]))
        conn.commit()
        print(f"🔑  ws_tokens generados para {len(rows)} clientes")
        print("\n✅  Migración completada.")
    finally:
        conn.close()


if __name__ == "__main__":
    run()