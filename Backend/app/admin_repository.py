from __future__ import annotations

import uuid
from app.db import get_conn
from app.utils import now_iso


def to_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value in (1, "1", "true", "True", "TRUE", "yes", "on"):
        return True
    if value in (0, "0", "false", "False", "FALSE", "no", "off"):
        return False
    return bool(value)


# ── GPS Devices ───────────────────────────────────────────────────────────

def get_all_devices() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT d.*, v.name AS vehicle_name, c.client_name, c.username
            FROM gps_devices d
            LEFT JOIN vehicles v ON d.vehicle_id = v.id
            LEFT JOIN app_clients c ON c.gps_device_id = d.id
            ORDER BY d.created_at DESC
        """)
        return [dict(r) for r in cur.fetchall()]


def get_device(device_id: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM gps_devices WHERE id = %s", (device_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_device_by_sim(sim_number: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM gps_devices WHERE sim_number = %s", (sim_number,))
        row = cur.fetchone()
        return dict(row) if row else None


def create_device(data: dict) -> dict:
    device_id = data.get("id") or f"dev-{uuid.uuid4().hex[:8]}"

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO gps_devices
            (id, name, sim_number, model, imei, vehicle_id, active, notes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s, %s)
        """, (
            device_id,
            data["name"],
            data["sim_number"],
            data.get("model"),
            data.get("imei"),
            data.get("vehicle_id") or None,
            data.get("notes"),
            now_iso(),
        ))

    return get_device(device_id)


def update_device(device_id: str, data: dict) -> dict | None:
    dev = get_device(device_id)
    if not dev:
        return None

    merged = {
        **dev,
        **{k: v for k, v in data.items() if v is not None},
    }

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE gps_devices
            SET name=%s,
                sim_number=%s,
                model=%s,
                imei=%s,
                vehicle_id=%s,
                active=%s,
                notes=%s
            WHERE id=%s
        """, (
            merged["name"],
            merged["sim_number"],
            merged.get("model"),
            merged.get("imei"),
            merged.get("vehicle_id") or None,
            to_bool(merged.get("active", True)),
            merged.get("notes"),
            device_id,
        ))

    return get_device(device_id)


def delete_device(device_id: str) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM gps_devices WHERE id = %s", (device_id,))
        return cur.rowcount > 0


# ── App Clients ────────────────────────────────────────────────────────────

def get_all_clients() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.*,
                   v.name AS vehicle_name,
                   d.sim_number,
                   d.name AS device_name,
                   d.model AS device_model
            FROM app_clients c
            LEFT JOIN vehicles v ON c.vehicle_id = v.id
            LEFT JOIN gps_devices d ON c.gps_device_id = d.id
            ORDER BY c.created_at DESC
        """)
        return [dict(r) for r in cur.fetchall()]


def get_client(client_id: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM app_clients WHERE id = %s", (client_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_client_by_username(username: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM app_clients WHERE username = %s", (username,))
        row = cur.fetchone()
        return dict(row) if row else None


def create_client(data: dict) -> dict:
    client_id = f"cli-{uuid.uuid4().hex[:8]}"

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO app_clients
            (id, username, password, client_name, email, phone,
             vehicle_id, gps_device_id, active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s)
        """, (
            client_id,
            data["username"],
            data["password"],
            data["client_name"],
            data.get("email"),
            data.get("phone"),
            data.get("vehicle_id") or None,
            data.get("gps_device_id") or None,
            now_iso(),
        ))

    return get_client(client_id)


def update_client(client_id: str, data: dict) -> dict | None:
    cli = get_client(client_id)
    if not cli:
        return None

    merged = {
        **cli,
        **{k: v for k, v in data.items() if v is not None},
    }

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE app_clients
            SET username=%s,
                password=%s,
                client_name=%s,
                email=%s,
                phone=%s,
                vehicle_id=%s,
                gps_device_id=%s,
                active=%s
            WHERE id=%s
        """, (
            merged["username"],
            merged["password"],
            merged["client_name"],
            merged.get("email"),
            merged.get("phone"),
            merged.get("vehicle_id") or None,
            merged.get("gps_device_id") or None,
            to_bool(merged.get("active", True)),
            client_id,
        ))

    return get_client(client_id)


def delete_client(client_id: str) -> bool:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM app_clients WHERE id = %s", (client_id,))
        return cur.rowcount > 0


def toggle_client_active(client_id: str) -> dict | None:
    cli = get_client(client_id)
    if not cli:
        return None

    new_val = not to_bool(cli.get("active", True))

    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "UPDATE app_clients SET active=%s WHERE id=%s",
            (new_val, client_id),
        )

    return get_client(client_id)


def get_client_for_login(username: str, password: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.*,
                   d.sim_number,
                   v.name AS vehicle_name
            FROM app_clients c
            LEFT JOIN gps_devices d ON c.gps_device_id = d.id
            LEFT JOIN vehicles v ON c.vehicle_id = v.id
            WHERE c.username=%s
              AND c.password=%s
              AND c.active=TRUE
        """, (username, password))

        row = cur.fetchone()
        return dict(row) if row else None