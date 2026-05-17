# GPS Backend EC — FastAPI completo

Backend listo para conectar con tu frontend GPS.

## Qué trae
- FastAPI
- SQLite
- CORS configurable
- API key simple para endpoints de escritura
- vehículos
- posiciones
- alertas
- métricas
- simulación básica para pruebas
- endpoint `/fleet` listo para conectar con la V11

## Instalar

```bash
python -m venv .venv
```

### Windows
```bash
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### macOS / Linux
```bash
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## URL base
```bash
http://localhost:8000
```

## Endpoint principal para tu frontend
```bash
GET /fleet
```

## API key para escritura
Los endpoints que crean, actualizan o eliminan usan header:

```bash
x-api-key: changeme123
```

## Conectar con tu frontend V11

En tu frontend:

```env
GPS_UPSTREAM_URL=http://localhost:8000/fleet
GPS_API_KEY=
NEXT_PUBLIC_CONTACT_PHONE=593XXXXXXXXX
NEXT_PUBLIC_BRAND_NAME=GPS Control EC
```
