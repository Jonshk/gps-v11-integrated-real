"""
logger.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/logger.py  (CREAR)

Qué resuelve:
  Sin esto: los errores en producción son invisibles.
  Solo ves algo si miras los logs de Render en el momento
  exacto que pasó. Si el servidor se reinicia, desaparecen.

  Con esto:
  - Sentry    → captura excepciones automáticamente con stack trace completo.
                Gratis hasta 5,000 errores/mes. Alertas por email.
  - Logtail   → todos los logs van a una interfaz web buscable.
                Gratis hasta 1GB/mes. Ideal para seguir el flujo en vivo.
  - Ambos son opcionales — si no configuras las keys, el sistema
    sigue funcionando con logs normales en consola.

Configuración en .env:
  SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
  LOGTAIL_TOKEN=tu-token-de-logtail
  LOG_LEVEL=INFO   (DEBUG | INFO | WARNING | ERROR)

pip install sentry-sdk logtail-python
(Solo instala los que vayas a usar)
"""
from __future__ import annotations
import os, logging, sys
from datetime import datetime

LOG_LEVEL   = os.getenv("LOG_LEVEL", "INFO").upper()
SENTRY_DSN  = os.getenv("SENTRY_DSN", "")
LOGTAIL_TOKEN = os.getenv("LOGTAIL_TOKEN", "")


# ─── Formatter con contexto GPS ───────────────────────────────

class GPSFormatter(logging.Formatter):
    """
    Formato estructurado para logs del backend GPS.
    Incluye timestamp, nivel, módulo y mensaje.
    En producción Render lo captura y Logtail lo indexa.
    """
    COLORS = {
        "DEBUG":    "\033[36m",    # cyan
        "INFO":     "\033[32m",    # verde
        "WARNING":  "\033[33m",    # amarillo
        "ERROR":    "\033[31m",    # rojo
        "CRITICAL": "\033[35m",    # magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        ts    = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        level = record.levelname
        color = self.COLORS.get(level, "")
        name  = record.name.split(".")[-1][:12].ljust(12)
        msg   = record.getMessage()

        if record.exc_info:
            msg += "\n" + self.formatException(record.exc_info)

        # Render captura stdout/stderr → formato limpio y legible
        return f"{color}[{ts}] {level:<8} {name} | {msg}{self.RESET}"


def setup_logging() -> None:
    """
    Configurar logging al arrancar la app.
    Llamar desde main.py antes de crear la app FastAPI.
    """

    # ── 1. Logger raíz ────────────────────────────────────────
    root = logging.getLogger()
    root.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

    # Eliminar handlers existentes
    root.handlers.clear()

    # Handler a stdout (Render captura esto)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(GPSFormatter())
    root.addHandler(handler)

    # Silenciar logs ruidosos de librerías
    for noisy in ["uvicorn.access", "httpx", "httpcore"]:
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # ── 2. Sentry (opcional) ──────────────────────────────────
    if SENTRY_DSN:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.starlette import StarletteIntegration
            from sentry_sdk.integrations.logging import LoggingIntegration

            sentry_logging = LoggingIntegration(
                level=logging.WARNING,       # captura WARNING y arriba como breadcrumbs
                event_level=logging.ERROR,   # crea eventos para ERROR y arriba
            )

            sentry_sdk.init(
                dsn=SENTRY_DSN,
                integrations=[
                    FastApiIntegration(),
                    StarletteIntegration(),
                    sentry_logging,
                ],
                traces_sample_rate=0.1,   # 10% de requests para performance
                environment=os.getenv("ENVIRONMENT", "production"),
                release=os.getenv("APP_VERSION", "3.2.0"),
            )
            logging.info("[LOGGER] Sentry activado")
        except ImportError:
            logging.warning("[LOGGER] sentry-sdk no instalado — pip install sentry-sdk")
        except Exception as e:
            logging.warning(f"[LOGGER] Sentry falló: {e}")

    # ── 3. Logtail (opcional) ─────────────────────────────────
    if LOGTAIL_TOKEN:
        try:
            from logtail import LogtailHandler
            lt_handler = LogtailHandler(source_token=LOGTAIL_TOKEN)
            lt_handler.setLevel(logging.INFO)
            root.addHandler(lt_handler)
            logging.info("[LOGGER] Logtail activado")
        except ImportError:
            logging.warning("[LOGGER] logtail-python no instalado — pip install logtail-python")
        except Exception as e:
            logging.warning(f"[LOGGER] Logtail falló: {e}")

    # ── 4. Log de inicio ──────────────────────────────────────
    env = os.getenv("ENVIRONMENT", "development")
    logging.info(f"[LOGGER] GPS Control EC arrancando — env:{env} level:{LOG_LEVEL} "
                 f"sentry:{'✓' if SENTRY_DSN else '✗'} "
                 f"logtail:{'✓' if LOGTAIL_TOKEN else '✗'}")


# ─── Helpers para logs con contexto ───────────────────────────

def log_gps_update(sim: str, lat: float, lng: float, speed: float,
                   km_added: float, alerts: int) -> None:
    logging.getLogger("gps.update").info(
        f"pos sim={sim} lat={lat:.5f} lng={lng:.5f} "
        f"speed={speed:.0f}km/h +{km_added:.3f}km alerts={alerts}"
    )


def log_command_sent(client_id: str, command: str, sim: str, cmd_id: str) -> None:
    logging.getLogger("sms.command").info(
        f"queued client={client_id} cmd={command} sim={sim} id={cmd_id}"
    )


def log_ws_event(event: str, key: str, total_connections: int) -> None:
    logging.getLogger("ws").debug(
        f"{event} key={key} total={total_connections}"
    )


def log_alert(client_id: str, vehicle: str, alert_type: str, message: str) -> None:
    logging.getLogger("alert").warning(
        f"type={alert_type} client={client_id} vehicle={vehicle} msg={message[:80]}"
    )


def log_auth_failure(endpoint: str, ip: str, username: str = "") -> None:
    """Log de intentos fallidos — Sentry los captura como eventos."""
    logging.getLogger("auth").warning(
        f"FAILED endpoint={endpoint} ip={ip} username={username}"
    )


def capture_exception(e: Exception, context: dict = None) -> None:
    """
    Captura una excepción en Sentry con contexto adicional.
    Usar en bloques except para errores críticos.
    """
    logger = logging.getLogger("exception")
    logger.error(f"{type(e).__name__}: {e}", exc_info=True)
    if SENTRY_DSN:
        try:
            import sentry_sdk
            if context:
                with sentry_sdk.push_scope() as scope:
                    for k, v in context.items():
                        scope.set_extra(k, v)
                    sentry_sdk.capture_exception(e)
            else:
                sentry_sdk.capture_exception(e)
        except Exception:
            pass