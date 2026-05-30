"""
sms_queue_worker.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/sms_queue_worker.py  (CREAR)

Qué resuelve:
  Sin esto: si la app Android gateway está caída cuando
  el admin envía un comando, el SMS se pone en sms_queue
  pero nunca se reintenta. Cuando la gateway vuelve, solo
  recoge comandos nuevos, los viejos se pierden.

  Con esto: un worker que corre en background revisa
  la cola cada 30 segundos, detecta comandos pendientes
  con más de N minutos, y los marca como failed con el
  motivo. También limpia registros viejos automáticamente.
  
  Si quieres reintentos reales (no solo marcado), el worker
  puede llamar directamente a la API de SMS si tienes una
  (Twilio, Vonage, etc.) o notificar por WhatsApp que el
  comando está pendiente.

Uso:
  Se arranca automáticamente en el startup de main.py.
  No requiere dependencias extra.
"""
from __future__ import annotations
import asyncio, logging
from datetime import datetime, timedelta
from app.db import get_conn
import os

logger = logging.getLogger(__name__)

# Tiempo máximo que un SMS puede estar pendiente antes de marcarse como timeout
SMS_TIMEOUT_MINUTES = int(os.getenv("SMS_TIMEOUT_MINUTES", "15"))

# Cada cuántos segundos revisar la cola
WORKER_INTERVAL_SECONDS = 30

# Cuántos días guardar el historial de SMS (luego se limpia)
SMS_HISTORY_DAYS = 30


async def sms_queue_worker():
    """
    Worker asíncrono que corre en background.
    Arranca junto con FastAPI y nunca termina.
    """
    logger.info(f"[SMS_WORKER] Arrancando — timeout: {SMS_TIMEOUT_MINUTES}min, intervalo: {WORKER_INTERVAL_SECONDS}s")

    while True:
        try:
            await _process_queue()
            await _cleanup_old_records()
        except Exception as e:
            logger.error(f"[SMS_WORKER] Error en ciclo: {e}")

        await asyncio.sleep(WORKER_INTERVAL_SECONDS)


async def _process_queue():
    """
    Revisa comandos pendientes:
    1. Si llevan más de SMS_TIMEOUT_MINUTES → marcar como 'timeout'
    2. Notificar por WhatsApp si hay comandos bloqueados
    """
    timeout_threshold = (datetime.utcnow() - timedelta(minutes=SMS_TIMEOUT_MINUTES)).isoformat()

    with get_conn() as conn:
        cur = conn.cursor()

        # Buscar comandos pendientes que superaron el timeout
        cur.execute("""
            SELECT q.id, q.to_number, q.body, q.command, q.client_id, q.created_at,
                   c.client_name, c.whatsapp_phone
            FROM sms_queue q
            LEFT JOIN app_clients c ON c.id = q.client_id
            WHERE q.status = 'pending'
              AND q.created_at < %s
            ORDER BY q.created_at ASC
        """, (timeout_threshold,))
        timed_out = cur.fetchall()

        if not timed_out:
            return

        logger.warning(f"[SMS_WORKER] {len(timed_out)} comandos en timeout")

        for row in timed_out:
            # Marcar como timeout
            cur.execute("""
                UPDATE sms_queue
                SET status = 'timeout',
                    error  = 'Gateway no respondió en %s minutos'
                WHERE id = %s
            """, (SMS_TIMEOUT_MINUTES, row["id"]))

            logger.warning(
                f"[SMS_WORKER] Timeout: cmd={row['command']} "
                f"to={row['to_number']} client={row['client_name']}"
            )

            # Notificar al cliente por WhatsApp que el comando no se pudo enviar
            phone = row.get("whatsapp_phone")
            if phone:
                await _notify_timeout(
                    phone=phone,
                    command=row["command"] or row["body"],
                    client_name=row["client_name"] or "",
                    created_at=row["created_at"],
                )

        # Contar comandos pendientes normales (gateway funcionando pero lenta)
        cur.execute("""
            SELECT COUNT(*) as cnt FROM sms_queue WHERE status = 'pending'
        """)
        pending_count = cur.fetchone()["cnt"]
        if pending_count > 10:
            logger.warning(f"[SMS_WORKER] Cola creciendo: {pending_count} pendientes")


async def _notify_timeout(phone: str, command: str, client_name: str, created_at: str):
    """Avisa por WhatsApp que un comando SMS no pudo enviarse."""
    api_key = os.getenv("CALLMEBOT_API_KEY", "")
    if not api_key:
        return
    try:
        import httpx
        msg = (
            f"⚠️ *GPS Control* — Comando no enviado\n"
            f"Comando: {command}\n"
            f"Enviado a las: {created_at[:16]}\n"
            f"La app gateway no estaba disponible.\n"
            f"Reenvía el comando manualmente."
        )
        url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={msg}&apikey={api_key}"
        async with httpx.AsyncClient() as http:
            await http.get(url, timeout=5)
    except Exception as e:
        logger.warning(f"[SMS_WORKER] Notificación WhatsApp falló: {e}")


async def _cleanup_old_records():
    """
    Limpia registros viejos de sms_queue y rate_limit_log.
    Corre una vez por hora aprox (cada 120 ciclos de 30s).
    """
    import random
    if random.randint(1, 120) != 1:
        return

    cutoff = (datetime.utcnow() - timedelta(days=SMS_HISTORY_DAYS)).isoformat()
    try:
        with get_conn() as conn:
            cur = conn.cursor()

            # Limpiar SMS viejos (enviados, fallados, timeout)
            cur.execute("""
                DELETE FROM sms_queue
                WHERE status IN ('sent', 'failed', 'timeout')
                  AND created_at < %s
            """, (cutoff,))
            deleted_sms = cur.rowcount

            # Limpiar rate limit log viejo
            cur.execute("""
                DELETE FROM rate_limit_log
                WHERE created_at < NOW() - INTERVAL '2 hours'
            """)
            deleted_rl = cur.rowcount

            if deleted_sms > 0 or deleted_rl > 0:
                logger.info(
                    f"[SMS_WORKER] Limpieza: {deleted_sms} SMS, {deleted_rl} rate_limit_log"
                )
    except Exception as e:
        logger.warning(f"[SMS_WORKER] Limpieza falló: {e}")


# ─── Stats de la cola (para el panel admin) ───────────────────

def get_queue_stats() -> dict:
    """Devuelve estadísticas actuales de la cola de SMS."""
    try:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT
                    status,
                    COUNT(*) as count
                FROM sms_queue
                WHERE created_at > NOW() - INTERVAL '24 hours'
                GROUP BY status
            """)
            rows = {r["status"]: r["count"] for r in cur.fetchall()}
            return {
                "pending": rows.get("pending", 0),
                "sent":    rows.get("sent", 0),
                "failed":  rows.get("failed", 0),
                "timeout": rows.get("timeout", 0),
                "total_24h": sum(rows.values()),
            }
    except Exception:
        return {"pending": 0, "sent": 0, "failed": 0, "timeout": 0, "total_24h": 0}