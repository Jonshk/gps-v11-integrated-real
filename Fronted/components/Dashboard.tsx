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

const DEMO_VEHICLES = [
  { id:"d1", name:"ECU-204", status:"active"  as const, lat:-2.1523, lng:-79.8731, speed:62, geofence:"Zona centro",  updatedAt:"" },
  { id:"d2", name:"ECU-107", status:"idle"    as const, lat:-2.2105, lng:-79.9234, speed:0,  geofence:"Zona norte",  updatedAt:"" },
  { id:"d3", name:"ECU-301", status:"offline" as const, lat:-2.1340, lng:-79.8412, speed:0,  geofence:"",            updatedAt:"" },
  { id:"d4", name:"ECU-088", status:"active"  as const, lat:-2.1876, lng:-79.9501, speed:44, geofence:"Zona sur",    updatedAt:"" },
  { id:"d5", name:"ECU-412", status:"active"  as const, lat:-2.1090, lng:-79.9088, speed:71, geofence:"Zona este",   updatedAt:"" },
];

const DEMO_METRICS = { active:3, idle:1, offline:1, alerts:2, routes:18 };

const DEMO_ALERTS = [
  { id:"a1", type:"geocerca", message:"ECU-204 ingreso a Zona centro",  severity:"low"    as const, createdAt:"" },
  { id:"a2", type:"velocidad", message:"ECU-412 supero limite de velocidad", severity:"medium" as const, createdAt:"" },
];

const STATUS_LABEL: Record<string,string> = { active:"Activo", idle:"En espera", offline:"Sin senal" };

export default function Dashboard({ fleet: liveFleet, connected }: Props) {
  const [fleet, setFleet]       = useState(liveFleet);
  const [isLive, setIsLive]     = useState(connected);
  const [lastUpdate, setLast]   = useState<Date|null>(null);
  const [pulsing, setPulsing]   = useState(false);
  const [selected, setSelected] = useState<string|null>(null);

  const showDemo = !isLive;
  const vehicles = showDemo ? DEMO_VEHICLES : fleet.vehicles;
  const metrics  = showDemo ? DEMO_METRICS  : fleet.metrics;
  const alerts   = showDemo ? DEMO_ALERTS   : fleet.alerts;

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/fleet", { cache:"no-store" });
      const json = await res.json();
      if (json.data) {
        setFleet(json.data);
        setIsLive(Boolean(json.connected));
        setLast(new Date());
        setPulsing(true);
        setTimeout(() => setPulsing(false), 500);
      }
    } catch { /* mantener */ }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const fmt = (d: Date|null) =>
    d ? d.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "--";

  const sel = vehicles.find(v => v.id === selected) ?? vehicles[0];

  return (
    <section id="panel" className="dash-section">
      <div className="dash-header">
        <div className="dash-header-left">
          <span className="eyebrow-light">Panel en vivo</span>
          <h2>Visibilidad operativa en tiempo real.</h2>
        </div>
        <div className="dash-header-right">
          <div className="dash-conn-badge">
            <span className={`live-dot ${isLive ? "live-dot-on" : "live-dot-off"}`} />
            <span>{isLive ? "Conectado" : "Demo"}</span>
            {lastUpdate && <span className="dash-time">{fmt(lastUpdate)}</span>}
          </div>
          <button className="dash-refresh" onClick={refresh} title="Actualizar">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="dash-body">
        {/* Columna izquierda */}
        <div className="dash-left">
          <div className={`dash-kpis ${pulsing ? "pulsing" : ""}`}>
            <div className="dash-kpi">
              <div className="dk-icon dk-icon-active">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
              <div><span className="dk-label">Activos</span><strong className="dk-num active">{metrics.active}</strong></div>
            </div>
            <div className="dash-kpi">
              <div className="dk-icon dk-icon-idle">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
              </div>
              <div><span className="dk-label">Rutas</span><strong className="dk-num">{metrics.routes}</strong></div>
            </div>
            <div className="dash-kpi">
              <div className="dk-icon dk-icon-alert">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              </div>
              <div><span className="dk-label">Alertas</span><strong className="dk-num alert">{metrics.alerts}</strong></div>
            </div>
            <div className="dash-kpi">
              <div className="dk-icon dk-icon-offline">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/></svg>
              </div>
              <div><span className="dk-label">Offline</span><strong className="dk-num offline">{metrics.offline}</strong></div>
            </div>
          </div>

          <div className="dash-vehicle-list">
            <div className="dvl-header">
              <span>Unidades</span>
              <span className="dvl-count">{vehicles.length} total</span>
            </div>
            {vehicles.map((v) => (
              <button
                key={v.id}
                className={`dvl-item ${selected === v.id ? "selected" : ""}`}
                onClick={() => setSelected(v.id === selected ? null : v.id)}
              >
                <span className={`dvl-status-dot s-${v.status}`} />
                <div className="dvl-info">
                  <strong>{v.name}</strong>
                  <span>{STATUS_LABEL[v.status]}{v.speed > 0 ? ` -- ${v.speed} km/h` : ""}</span>
                </div>
                <span className="dvl-geo">{v.geofence || "--"}</span>
              </button>
            ))}
          </div>

          <div className="dash-alerts">
            <div className="dvl-header">
              <span>Actividad reciente</span>
              {alerts.length > 0 && <span className="dvl-count alert-count">{alerts.length}</span>}
            </div>
            {alerts.length === 0
              ? <div className="da-empty">Sin alertas activas</div>
              : alerts.slice(0,4).map((a) => (
                  <div key={a.id} className={`da-row da-${a.severity}`}>
                    <span className={`da-dot da-dot-${a.severity}`} />
                    <div><strong>{a.message}</strong><span>{a.type}</span></div>
                  </div>
                ))
            }
          </div>

        </div>

        {/* Mapa */}
        <div className="dash-map-col">
          <div className="dash-map-wrap">
            <FleetMap vehicles={vehicles} />
            {sel && (
              <div className="dash-vehicle-card">
                <div className="dvc-header">
                  <span className={`dvc-status s-${sel.status}`}>{STATUS_LABEL[sel.status]}</span>
                  <strong>{sel.name}</strong>
                </div>
                <div className="dvc-stats">
                  <div className="dvc-stat"><span>Velocidad</span><strong>{sel.speed} km/h</strong></div>
                  <div className="dvc-stat"><span>Geocerca</span><strong>{sel.geofence || "Ninguna"}</strong></div>
                  <div className="dvc-stat"><span>Coords</span><strong>{sel.lat.toFixed(4)}, {sel.lng.toFixed(4)}</strong></div>
                </div>
              </div>
            )}
            <div className="dash-map-badge">
              <span className={`live-dot ${isLive ? "live-dot-on" : "live-dot-off"}`} />
              {isLive ? "En vivo" : "Demo -- Guayaquil, Ecuador"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}