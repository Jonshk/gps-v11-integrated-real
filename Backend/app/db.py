from __future__ import annotations
import os
from contextlib import contextmanager
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.ibojygwdtrrcwsguboak:Caracas2026**@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"
)

@contextmanager
def get_conn():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    with get_conn() as conn:
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                speed REAL NOT NULL DEFAULT 0,
                geofence TEXT,
                updated_at TEXT NOT NULL
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS positions (
                id SERIAL PRIMARY KEY,
                vehicle_id TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                speed REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL,
                severity TEXT NOT NULL
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS gps_devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sim_number TEXT NOT NULL UNIQUE,
                model TEXT,
                imei TEXT,
                vehicle_id TEXT REFERENCES vehicles(id),
                active INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                created_at TEXT NOT NULL
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS app_clients (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                client_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                vehicle_id TEXT REFERENCES vehicles(id),
                gps_device_id TEXT REFERENCES gps_devices(id),
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price TEXT NOT NULL,
                sub TEXT NOT NULL,
                description TEXT NOT NULL,
                features JSONB NOT NULL DEFAULT '[]',
                featured BOOLEAN NOT NULL DEFAULT FALSE,
                wa_msg TEXT NOT NULL,
                cta TEXT NOT NULL,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                sort_order INTEGER NOT NULL DEFAULT 0
            )
        """)

        cur.execute("CREATE INDEX IF NOT EXISTS idx_positions_vehicle ON positions(vehicle_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_clients_username ON app_clients(username)")

    from app.plans_repository import init_plans_table
    init_plans_table()