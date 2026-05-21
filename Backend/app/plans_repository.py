from __future__ import annotations
import json
from app.db import get_conn

DEFAULT_PLANS = [
    {
        "id": "basico",
        "name": "Basico",
        "price": "$9,99",
        "sub": "/mes por vehiculo",
        "desc": "Para empezar hoy mismo.",
        "features": ["1 vehiculo incluido", "GPS en tiempo real", "Historial 30 dias", "App movil iOS y Android", "Soporte por email"],
        "featured": False,
        "waMsg": "Hola, me interesa el plan Básico de GPS Control EC. ¿Cómo lo adquiero?",
        "cta": "Adquirir por WhatsApp",
        "active": True,
        "sort_order": 1,
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": "$14,99",
        "sub": "/mes por vehiculo",
        "desc": "El plan mas solicitado.",
        "features": ["Hasta 10 vehiculos", "Geocercas ilimitadas", "Alertas SMS y push", "Soporte prioritario 24/7", "Reportes automaticos"],
        "featured": True,
        "waMsg": "Hola, quiero adquirir el plan Pro de GPS Control EC. ¿Cómo procedo?",
        "cta": "Adquirir por WhatsApp",
        "active": True,
        "sort_order": 2,
    },
    {
        "id": "flotas",
        "name": "Flotas",
        "price": "A medida",
        "sub": "precio por volumen",
        "desc": "Para operaciones grandes.",
        "features": ["Vehiculos ilimitados", "Panel operativo avanzado", "Integracion API", "Gestor de cuenta dedicado", "SLA garantizado"],
        "featured": False,
        "waMsg": "Hola, tengo una flota grande y quiero cotizar el plan Flotas de GPS Control EC.",
        "cta": "Cotizar por WhatsApp",
        "active": True,
        "sort_order": 3,
    },
]


def init_plans_table() -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as n FROM plans")
        count = cur.fetchone()["n"]
        if count == 0:
            for p in DEFAULT_PLANS:
                cur.execute("""
                    INSERT INTO plans (id, name, price, sub, description, features,
                        featured, wa_msg, cta, active, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    p["id"], p["name"], p["price"], p["sub"], p["desc"],
                    json.dumps(p["features"]),
                    p["featured"], p["waMsg"], p["cta"],
                    p["active"], p["sort_order"],
                ))


def _row_to_dict(row: dict) -> dict:
    features = row["features"]
    if isinstance(features, str):
        features = json.loads(features)
    return {
        "id":         row["id"],
        "name":       row["name"],
        "price":      row["price"],
        "sub":        row["sub"],
        "desc":       row.get("description") or row.get("desc", ""),
        "features":   features,
        "featured":   bool(row["featured"]),
        "waMsg":      row["wa_msg"],
        "cta":        row["cta"],
        "active":     bool(row["active"]),
        "sort_order": row["sort_order"],
    }


def get_all_plans(only_active: bool = False) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        query = "SELECT * FROM plans"
        if only_active:
            query += " WHERE active = TRUE"
        query += " ORDER BY sort_order ASC"
        cur.execute(query)
        return [_row_to_dict(dict(r)) for r in cur.fetchall()]


def get_plan(plan_id: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM plans WHERE id = %s", (plan_id,))
        row = cur.fetchone()
        return _row_to_dict(dict(row)) if row else None


def update_plan(plan_id: str, data: dict) -> dict | None:
    plan = get_plan(plan_id)
    if not plan:
        return None
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""
            UPDATE plans
            SET name=%s, price=%s, sub=%s, description=%s, features=%s,
                featured=%s, wa_msg=%s, cta=%s, active=%s, sort_order=%s
            WHERE id=%s
        """, (
            data.get("name", plan["name"]),
            data.get("price", plan["price"]),
            data.get("sub", plan["sub"]),
            data.get("desc", plan["desc"]),
            json.dumps(data.get("features", plan["features"])),
            data.get("featured", plan["featured"]),
            data.get("waMsg", plan["waMsg"]),
            data.get("cta", plan["cta"]),
            data.get("active", plan["active"]),
            data.get("sort_order", plan["sort_order"]),
            plan_id,
        ))
    return get_plan(plan_id)


def reset_plans() -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM plans")
        for p in DEFAULT_PLANS:
            cur.execute("""
                INSERT INTO plans (id, name, price, sub, description, features,
                    featured, wa_msg, cta, active, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                p["id"], p["name"], p["price"], p["sub"], p["desc"],
                json.dumps(p["features"]),
                p["featured"], p["waMsg"], p["cta"],
                p["active"], p["sort_order"],
            ))
    return get_all_plans()
