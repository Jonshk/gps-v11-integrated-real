from __future__ import annotations
import os
from twilio.rest import Client

TWILIO_SID    = os.getenv("TWILIO_SID", "")
TWILIO_TOKEN  = os.getenv("TWILIO_TOKEN", "")
TWILIO_FROM   = os.getenv("TWILIO_FROM", "+19067027829")
GPS_PASSWORD  = os.getenv("GPS_PASSWORD", "123456")

_COMMANDS = {
    "locate":        lambda p: f"check{p}",
    "stop_engine":   lambda p: f"stop{p}",
    "start_engine":  lambda p: f"resume{p}",
    "move_alert":    lambda p: f"move{p}",
    "speed_alert":   lambda p: f"speed{p} 080",
    "online":        lambda p: f"online{p}",
    "monitor":       lambda p: f"monitor{p}",
}

COMMAND_LABELS = {
    "locate":       "Localizar",
    "stop_engine":  "Apagar motor",
    "start_engine": "Encender motor",
    "move_alert":   "Alerta movimiento",
    "speed_alert":  "Alerta velocidad",
    "online":       "Modo activo",
    "monitor":      "Micrófono",
}


def send_gps_command(command: str, sim_number: str) -> dict:
    """
    Envía un comando SMS al GPS via Twilio.
    Retorna {"ok": True, "message": "..."} o {"ok": False, "error": "..."}
    """
    if command not in _COMMANDS:
        return {"ok": False, "error": f"Comando desconocido: {command}"}

    if not TWILIO_SID or not TWILIO_TOKEN:
        return {"ok": False, "error": "Twilio no configurado. Añade TWILIO_SID y TWILIO_TOKEN en variables de entorno."}

    msg_body = _COMMANDS[command](GPS_PASSWORD)

    try:
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        message = client.messages.create(
            body=msg_body,
            from_=TWILIO_FROM,
            to=sim_number,
        )
        return {
            "ok": True,
            "sid": message.sid,
            "message": f"Comando '{COMMAND_LABELS.get(command, command)}' enviado a {sim_number}",
            "sms_body": msg_body,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def get_available_commands() -> list[dict]:
    return [
        {"command": k, "label": COMMAND_LABELS[k]}
        for k in _COMMANDS
    ]
