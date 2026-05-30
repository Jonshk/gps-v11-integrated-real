"""
ws_manager.py  (versión Redis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Va en: Backend/app/ws_manager.py  (REEMPLAZAR)

Qué resuelve:
  Sin Redis: si Render despliega 2 instancias del backend,
  el GPS actualiza la posición en la instancia A, pero el
  cliente web está conectado a la instancia B → no recibe nada.

  Con Redis Pub/Sub: todas las instancias se suscriben al
  mismo canal. Cuando llega una posición, se publica en Redis
  y TODAS las instancias la reenvían a sus WebSockets conectados.

Configuración:
  Añadir en .env:
    REDIS_URL=redis://localhost:6379
    (En Render: Redis add-on → copiar Internal Redis URL)

  Si REDIS_URL no está configurado, cae back a modo local
  (igual que la versión anterior, sin Redis). Así no rompe
  en desarrollo local sin Redis instalado.

pip install redis
"""
from __future__ import annotations
import os, json, asyncio, logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "")


# ─── Manager local (fallback sin Redis) ───────────────────────

class LocalConnectionManager:
    """Funciona en una sola instancia. Igual que antes."""

    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, key: str):
        await ws.accept()
        self.active.setdefault(key, []).append(ws)
        logger.info(f"[WS:local] conectado: {key} — total: {self._total()}")

    def disconnect(self, ws: WebSocket, key: str):
        if key in self.active:
            try: self.active[key].remove(ws)
            except ValueError: pass
            if not self.active[key]: del self.active[key]

    async def send(self, key: str, data: dict):
        dead = []
        for ws in self.active.get(key, []):
            try: await ws.send_text(json.dumps(data))
            except: dead.append(ws)
        for ws in dead:
            try: self.active[key].remove(ws)
            except: pass

    async def publish(self, key: str, data: dict):
        """En modo local, publish = send directo."""
        await self.send(key, data)

    async def broadcast(self, data: dict):
        for key in list(self.active): await self.send(key, data)

    def _total(self): return sum(len(v) for v in self.active.values())


# ─── Manager con Redis Pub/Sub ────────────────────────────────

class RedisConnectionManager(LocalConnectionManager):
    """
    Extiende LocalConnectionManager con Redis Pub/Sub.
    - Las conexiones WebSocket siguen siendo locales a cada instancia.
    - Los mensajes se publican en Redis → todas las instancias los reciben
      y los reenvían a sus WebSockets locales.
    """

    def __init__(self):
        super().__init__()
        self._redis_pub  = None   # cliente para publicar
        self._redis_sub  = None   # cliente para suscribirse
        self._sub_task: asyncio.Task | None = None
        self._channel = "gps:broadcast"

    async def startup(self):
        """Llamar en el evento startup de FastAPI."""
        import redis.asyncio as aioredis
        try:
            self._redis_pub = aioredis.from_url(REDIS_URL, decode_responses=True)
            self._redis_sub = aioredis.from_url(REDIS_URL, decode_responses=True)
            # Ping para verificar conexión
            await self._redis_pub.ping()
            logger.info(f"[WS:redis] conectado a Redis: {REDIS_URL[:30]}...")
            # Arrancar listener en background
            self._sub_task = asyncio.create_task(self._listen())
        except Exception as e:
            logger.error(f"[WS:redis] falló conexión Redis: {e} — usando modo local")
            self._redis_pub = None

    async def shutdown(self):
        if self._sub_task:
            self._sub_task.cancel()
        if self._redis_pub: await self._redis_pub.aclose()
        if self._redis_sub: await self._redis_sub.aclose()

    async def publish(self, key: str, data: dict):
        """
        Publica el mensaje en Redis.
        Todas las instancias (incluyendo esta) lo recibirán
        por el listener y lo enviarán a sus WebSockets locales.
        """
        if not self._redis_pub:
            # Fallback a envío local si Redis no está disponible
            await self.send(key, data)
            return
        try:
            payload = json.dumps({"key": key, "data": data})
            await self._redis_pub.publish(self._channel, payload)
        except Exception as e:
            logger.warning(f"[WS:redis] publish falló: {e} — enviando local")
            await self.send(key, data)

    async def _listen(self):
        """Loop que recibe mensajes de Redis y los reenvía a los WebSockets locales."""
        try:
            pubsub = self._redis_sub.pubsub()
            await pubsub.subscribe(self._channel)
            logger.info(f"[WS:redis] suscrito a canal '{self._channel}'")
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    payload = json.loads(message["data"])
                    key  = payload["key"]
                    data = payload["data"]
                    await self.send(key, data)
                except Exception as e:
                    logger.warning(f"[WS:redis] mensaje inválido: {e}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[WS:redis] listener caído: {e}")


# ─── Instancia global ─────────────────────────────────────────
# Si REDIS_URL está configurado → usa Redis
# Si no → modo local (desarrollo sin Redis)

if REDIS_URL:
    manager = RedisConnectionManager()
    logger.info("[WS] Modo Redis activado")
else:
    manager = LocalConnectionManager()
    logger.info("[WS] Modo local (sin Redis)")