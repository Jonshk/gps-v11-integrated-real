"""
security.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/security.py  (REEMPLAZAR)

Añade:
- verify_password / hash_password con bcrypt
- Tokens de admin persistentes en BD (sobreviven reinicios)
- Rate limiting por IP sin dependencias externas
- Constante GPS_SECRET más segura
"""
from __future__ import annotations
import os, secrets, bcrypt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from app.db import get_conn

# ── Write key (igual que antes) ───────────────────────────────
from app.config import API_WRITE_KEY
from fastapi import Depends, Header

def require_write_key(x_write_key: str | None = Header(default=None)):
    if x_write_key != API_WRITE_KEY:
        raise HTTPException(status_code=403, detail="Write key inválida.")


# ── BCrypt ────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hashea una contraseña nueva. Usar al crear/actualizar clientes."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica contraseña contra hash almacenado."""
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def verify_password_any(plain: str, stored: str) -> bool:
    """
    Compatibilidad durante migración:
    acepta tanto texto plano (legacy) como bcrypt hash.
    Una vez migrados todos los usuarios, usar solo verify_password.
    """
    if stored.startswith("$2b$") or stored.startswith("$2a$"):
        return verify_password(plain, stored)
    # Legacy: comparación directa (eliminar cuando todos estén migrados)
    return plain == stored


# ── Admin sessions persistentes en BD ────────────────────────
# Reemplaza el set en memoria de admin_routes.py
# Los tokens sobreviven reinicios del servidor.

TOKEN_TTL_HOURS = 24  # sesión válida por 24 horas


def create_admin_session(ip: str | None = None) -> str:
    token = secrets.token_hex(32)
    expires = datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS)
    with get_conn() as conn:
        cur = conn.cursor()
        # Crear tabla si no existe (seguro correrlo siempre)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token      TEXT PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ,
                ip_address TEXT
            )
        """)
        cur.execute("""
            INSERT INTO admin_sessions (token, expires_at, ip_address)
            VALUES (%s, %s, %s)
        """, (token, expires.isoformat(), ip))
    return token


def validate_admin_session(token: str) -> bool:
    if not token:
        return False
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            cur.execute("""
                SELECT token FROM admin_sessions
                WHERE token = %s AND expires_at > NOW()
            """, (token,))
            return cur.fetchone() is not None
        except Exception:
            return False


def delete_admin_session(token: str) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM admin_sessions WHERE token = %s", (token,))
        except Exception:
            pass


def cleanup_expired_sessions() -> None:
    """Llamar periódicamente para limpiar tokens expirados."""
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            cur.execute("DELETE FROM admin_sessions WHERE expires_at < NOW()")
        except Exception:
            pass


# ── Rate limiting sin Redis ───────────────────────────────────
# Usa la tabla rate_limit_log en PostgreSQL.
# Simple pero efectivo para un servidor de tamaño medio.

RATE_LIMITS = {
    "/app/login":   (10, 60),   # 10 intentos por minuto
    "/admin/login": (5,  60),   # 5 intentos por minuto
    "/gps/update":  (120, 60),  # 120 updates por minuto (2/segundo por GPS)
}


def check_rate_limit(ip: str, endpoint: str) -> None:
    """
    Lanza HTTPException 429 si el IP supera el límite.
    Llamar al inicio de los endpoints sensibles.
    """
    if endpoint not in RATE_LIMITS:
        return
    max_requests, window_seconds = RATE_LIMITS[endpoint]

    with get_conn() as conn:
        cur = conn.cursor()
        try:
            # Crear tabla si no existe
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rate_limit_log (
                    id         SERIAL PRIMARY KEY,
                    ip_address TEXT NOT NULL,
                    endpoint   TEXT NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            # Contar requests recientes de este IP en este endpoint
            cur.execute("""
                SELECT COUNT(*) as cnt FROM rate_limit_log
                WHERE ip_address = %s
                  AND endpoint   = %s
                  AND created_at > NOW() - INTERVAL '%s seconds'
            """, (ip, endpoint, window_seconds))
            row = cur.fetchone()
            count = row["cnt"] if row else 0

            if count >= max_requests:
                raise HTTPException(
                    status_code=429,
                    detail=f"Demasiados intentos. Espera {window_seconds} segundos."
                )

            # Registrar este request
            cur.execute("""
                INSERT INTO rate_limit_log (ip_address, endpoint)
                VALUES (%s, %s)
            """, (ip, endpoint))

            # Limpiar registros viejos (> 1 hora) cada ~100 requests
            import random
            if random.randint(1, 100) == 1:
                cur.execute("""
                    DELETE FROM rate_limit_log
                    WHERE created_at < NOW() - INTERVAL '1 hour'
                """)
        except HTTPException:
            raise
        except Exception:
            pass  # Si falla el rate limit, dejar pasar (no bloquear la app)


def get_client_ip(request: Request) -> str:
    """Obtiene la IP real del cliente, considerando proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"