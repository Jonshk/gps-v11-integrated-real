import { NextResponse } from "next/server";
import type { FleetPayload } from "@/lib/fleet";

function emptyPayload(): FleetPayload {
  return {
    vehicles: [],
    alerts: [],
    metrics: { active: 0, idle: 0, offline: 0, alerts: 0, routes: 0 }
  };
}

export async function GET() {
  const upstream = process.env.GPS_UPSTREAM_URL;
  const apiKey = process.env.GPS_API_KEY;

  if (!upstream) {
    return NextResponse.json({
      ok: true,
      connected: false,
      data: emptyPayload(),
      message: "Sin GPS_UPSTREAM_URL configurado."
    });
  }

  try {
    const response = await fetch(upstream, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        connected: false,
        data: emptyPayload(),
        message: `Error del backend GPS: ${response.status}`
      }, { status: 502 });
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      connected: true,
      data
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      connected: false,
      data: emptyPayload(),
      message: "No se pudo conectar con el backend GPS."
    }, { status: 502 });
  }
}
