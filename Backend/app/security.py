from fastapi import Header, HTTPException
from app.config import API_WRITE_KEY

def require_write_key(x_api_key: str | None = Header(default=None)) -> None:
    if x_api_key != API_WRITE_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing x-api-key")
