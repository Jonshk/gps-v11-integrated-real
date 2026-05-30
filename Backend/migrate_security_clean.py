"""
migrate_security.py  (versión limpia sin credenciales)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en:   Backend/  (raíz)
Correr:  python migrate_security.py
Borrar después.

Requiere que DATABASE_URL esté en Backend/.env
pip install bcrypt
"""
from __future__ import annotations
import os, bcrypt
from dotenv import load_dotenv
load_dotenv()   # lee .env automáticamente

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("❌  DATABASE_URL no encontrado en .env")


def run():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        cur = conn.cursor()

        # 1. Tabla sesiones admin persistentes
        cur.execute("""
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token      TEXT PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ,
                ip_address TEXT
            )
        """)
        conn.commit(); print("✅  admin_sessions")

        # 2. Tabla rate limiting
        cur.execute("""
            CREATE TABLE IF NOT EXISTS rate_limit_log (
                id         SERIAL PRIMARY KEY,
                ip_address TEXT NOT NULL,
                endpoint   TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_rl_ip_ep
            ON rate_limit_log(ip_address, endpoint, created_at)
        """)
        conn.commit(); print("✅  rate_limit_log")

        # 3. Columna password_hashed
        cur.execute("""
            ALTER TABLE app_clients
            ADD COLUMN IF NOT EXISTS password_hashed TEXT
        """)
        conn.commit(); print("✅  columna password_hashed")

        # 4. Hashear contraseñas existentes
        cur.execute("SELECT id, password FROM app_clients WHERE password_hashed IS NULL")
        rows = cur.fetchall(); count = 0
        for row in rows:
            plain = row["password"] or ""
            if not plain: continue
            if plain.startswith("$2b$") or plain.startswith("$2a$"):
                cur.execute("UPDATE app_clients SET password_hashed=%s WHERE id=%s", (plain, row["id"]))
                print(f"⏭️   {row['id']} — ya hasheada, copiada")
                continue
            hashed = bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()
            cur.execute(
                "UPDATE app_clients SET password_hashed=%s WHERE id=%s",
                (hashed, row["id"])
            )
            count += 1

        conn.commit()
        print(f"🔑  {count} contraseñas hasheadas con bcrypt")
        print("\n✅  Migración de seguridad completada.")

    finally:
        conn.close()


if __name__ == "__main__":
    run()