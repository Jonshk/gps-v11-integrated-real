"""
ws_routes.py
Va en: Backend/app/ws_routes.py
"""
from __future__ import annotations
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from app.ws_manager import manager
from app.db import get_conn
import logging

logger = logging.getLogger(__name__)


def register_ws_routes(app: FastAPI) -> None:

    # ── WS cliente individual ─────────────────────────────────
    # ws://host/ws/vehicle/{vehicle_id}?token=xxx
    @app.websocket("/ws/vehicle/{vehicle_id}")
    async def ws_vehicle(websocket: WebSocket, vehicle_id: str, token: str = Query(...)):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT id FROM app_clients WHERE ws_token = %s AND active = TRUE",
                (token,)
            )
            row = cur.fetchone()
        if not row:
            await websocket.close(code=4001)
            return

        key = f"vehicle_{vehicle_id}_{row['id']}"
        await manager.connect(websocket, key)
        try:
            while True:
                msg = await websocket.receive_text()
                if msg == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            manager.disconnect(websocket, key)

    # ── WS flota ──────────────────────────────────────────────
    # ws://host/ws/fleet/{client_id}?token=xxx
    @app.websocket("/ws/fleet/{client_id}")
    async def ws_fleet(websocket: WebSocket, client_id: str, token: str = Query(...)):
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT id FROM app_clients WHERE ws_token = %s AND id = %s AND active = TRUE",
                (token, client_id)
            )
            row = cur.fetchone()
        if not row:
            await websocket.close(code=4001)
            return

        key = f"fleet_{client_id}"
        await manager.connect(websocket, key)
        try:
            while True:
                msg = await websocket.receive_text()
                if msg == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            manager.disconnect(websocket, key)