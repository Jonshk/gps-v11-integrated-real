from __future__ import annotations
from typing import Optional
from uuid import uuid4
from datetime import datetime

from app.db import get_conn


# ─────────────────────────────────────────────────────────────
# CLIENTES
# ─────────────────────────────────────────────────────────────

def list_clients():
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                c.*,
                v.name AS vehicle_name,
                d.name AS device_name,
                d.sim_number,
                d.model AS device_model
            FROM app_clients c
            LEFT JOIN vehicles v ON c.vehicle_id = v.id
            LEFT JOIN gps_devices d ON c.gps_device_id = d.id
            ORDER BY c.created_at DESC
        """)
        return cur.fetchall()


def get_client_by_username(username: str):
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM app_clients WHERE username = %s",
            (username,)
        )
        return cur.fetchone()


def create_client(data: dict):
    with get_conn() as conn:
        cur = conn.cursor()

        client = {
            "id": str(uuid4()),
            "username": data["username"],
            "password": data["password"],
            "client_name": data["client_name"],
            "email": data.get("email"),
            "phone": data.get("phone"),
            "vehicle_id": data.get("vehicle_id"),
            "gps_device_id": data.get("gps_device_id"),
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        }

        cur.execute("""
            INSERT INTO app_clients (
                id,
                username,
                password,
                client_name,
                email,
                phone,
                vehicle_id,
                gps_device_id,
                active,
                created_at
            )
            VALUES (
                %(id)s,
                %(username)s,
                %(password)s,
                %(client_name)s,
                %(email)s,
                %(phone)s,
                %(vehicle_id)s,
                %(gps_device_id)s,
                %(active)s,
                %(created_at)s
            )
        """, client)

        return client


# ─────────────────────────────────────────────────────────────
# GPS DEVICES
# ─────────────────────────────────────────────────────────────

def list_devices():
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                d.*,
                v.name AS vehicle_name
            FROM gps_devices d
            LEFT JOIN vehicles v ON d.vehicle_id = v.id
            ORDER BY d.created_at DESC
        """)
        return cur.fetchall()


def create_device(data: dict):
    with get_conn() as conn:
        cur = conn.cursor()

        device = {
            "id": str(uuid4()),
            "name": data["name"],
            "sim_number": data["sim_number"],
            "model": data.get("model"),
            "imei": data.get("imei"),
            "vehicle_id": data.get("vehicle_id"),
            "notes": data.get("notes"),
            "active": True,
            "created_at": datetime.utcnow().isoformat()
        }

        cur.execute("""
            INSERT INTO gps_devices (
                id,
                name,
                sim_number,
                model,
                imei,
                vehicle_id,
                notes,
                active,
                created_at
            )
            VALUES (
                %(id)s,
                %(name)s,
                %(sim_number)s,
                %(model)s,
                %(imei)s,
                %(vehicle_id)s,
                %(notes)s,
                %(active)s,
                %(created_at)s
            )
        """, device)

        return device