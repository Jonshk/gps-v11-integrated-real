from __future__ import annotations

from datetime import datetime, timezone
from random import uniform

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def random_shift(value: float, delta: float = 0.002) -> float:
    return round(value + uniform(-delta, delta), 6)
