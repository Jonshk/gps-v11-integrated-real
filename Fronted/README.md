# GPS V11 integrado

Esta versión ya no usa mockups para el panel principal:
- mapa real con MapLibre
- ruta /api/fleet para integrar tu backend GPS real
- métricas y alertas consumidas desde backend si configuras variables de entorno

## Instalar
npm install
npm run dev

## Configurar backend real
Crea `.env.local` con:

GPS_UPSTREAM_URL=https://tu-backend-gps.com/api/fleet
GPS_API_KEY=tu_api_key
NEXT_PUBLIC_CONTACT_PHONE=593XXXXXXXXX
NEXT_PUBLIC_BRAND_NAME=GPS Control EC

## Formato esperado del backend GPS
{
  "vehicles": [
    {
      "id": "veh-1",
      "name": "ECU-204",
      "status": "active",
      "lat": -2.17,
      "lng": -79.88,
      "speed": 62,
      "geofence": "Zona norte",
      "updatedAt": "2026-04-06T20:00:00Z"
    }
  ],
  "alerts": [
    {
      "id": "al-1",
      "type": "movement",
      "message": "Movimiento detectado",
      "createdAt": "2026-04-06T20:10:00Z",
      "severity": "medium"
    }
  ],
  "metrics": {
    "active": 4,
    "idle": 2,
    "offline": 1,
    "alerts": 12,
    "routes": 128
  }
}
