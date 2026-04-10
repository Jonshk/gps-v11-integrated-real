import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "GPS Backend EC")
API_WRITE_KEY = os.getenv("API_WRITE_KEY", "changeme123")
DB_FILE = os.getenv("DB_FILE", "data.db")
CORS_ORIGINS = [
    item.strip()
    for item in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if item.strip()
]
