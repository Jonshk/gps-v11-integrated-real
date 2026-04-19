"use client";

import { useEffect, useState, useCallback } from "react";
import type { FleetPayload } from "@/lib/fleet";
import FleetMap from "@/components/FleetMap";

type Props = {
  fleet: FleetPayload;
  connected: boolean;
  message?: string;
};

const POLL_MS = 20000;

export default function Dashboard({ fleet: initialFleet, connected: initialConnected, message }: Props) {
  const [fleet, setFleet]           = useState(initialFleet);
  const [connected, setConnected]   = useState(initialConnected);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pulsing, setPulsing]       = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/fleet", { cache: "no-store" });
      const json = await res.json();
      if (json.data) {
        setFleet(json.data);
        setConnected(Boolean(json.connected));
        setLastUpdate(new Date());
        setPulsing(true);
        setTimeout(() => setPulsing(false), 600);
      }
    } catch {
      // mantener datos anteriores
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const latestVehicle = fleet.vehicles[0];

  function fmt(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <section id="panel" className="section section-dark panel-grid">
      <div className="panel-copy">
        <span className="eyebrow">Panel en vivo</span>
        <h2>Visibilidad operativa desde un solo punto.</h2>
        <p>
          Mapa real, métricas reales y alertas reales. Datos actualizados
          automáticamente cada {POLL_MS / 1000}s.
        </p>

        <div className={`kpis ${pulsing ? "kpis-pulse" : ""}`}>
          <div className="kpi"><small>Activos</small><strong className="kpi-active">{fleet.metrics.active}</strong></div>
          <div className="kpi"><small>Alertas</small><strong className="kpi-alert">{fleet.metrics.alerts}</strong></div>
          <div className="kpi"><small>Rutas</small><strong>{fleet.metrics.routes}</strong></div>
          <div className="kpi"><small>Offline</small><strong className="kpi-offline">{fleet.metrics.offline}</strong></div>
        </div>

        <div className="live-status">
          <span className={`live-dot ${connected ? "live-dot-on" : "live-dot-off"}`} />
          <span className="live-label">{connected ? "Conectado" : "Sin conexión"}</span>
          {lastUpdate && <span className="live-time">· Actualizado {fmt(lastUpdate)}</span>}
          <button className="refresh-btn" onClick={refresh} title="Actualizar ahora">↻</button>
        </div>

        {!connected && (
          <div className="integration-note">
            <strong>Integración pendiente</strong>
            <p>{message || "Configura GPS_UPSTREAM_URL en tu .env para mostrar tu flota real."}</p>
          </div>
        )}
      </div>

      <div className="panel-card">
        <div className="panel-card-head">
          <span>Seguimiento</span>
          <strong>{connected ? "En vivo" : "Sin señal"}</strong>
        </div>

        <FleetMap vehicles={fleet.vehicles} />

        <div className="panel-bottom">
          <div className="vehicle-summary">
            <small>Unidad principal</small>
            <strong>{latestVehicle?.name || "Sin unidades"}</strong>
            <span>
              {latestVehicle
                ? `${latestVehicle.speed} km/h · ${latestVehicle.geofence || "Sin geocerca"}`
                : "Esperando vehículos conectados"}
            </span>
          </div>

          <div className="alerts-list">
            <small>Actividad reciente</small>
            {fleet.alerts.length === 0 ? (
              <div className="alert-row empty">Sin alertas activas.</div>
            ) : (
              fleet.alerts.slice(0, 3).map((alert) => (
                <div className={`alert-row ${alert.severity}`} key={alert.id}>
                  <b>{alert.message}</b>
                  <span>{alert.type}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}