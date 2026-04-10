import type { FleetPayload } from "@/lib/fleet";
import FleetMap from "@/components/FleetMap";

type Props = {
  fleet: FleetPayload;
  connected: boolean;
  message?: string;
};

export default function Dashboard({ fleet, connected, message }: Props) {
  const latestVehicle = fleet.vehicles[0];

  return (
    <section id="panel" className="section section-dark panel-grid">
      <div className="panel-copy">
        <span className="eyebrow">Panel en vivo</span>
        <h2>Visibilidad operativa desde un solo punto.</h2>
        <p>
          Mapa real, métricas reales y alertas reales. Si conectas tu backend GPS, esta
          sección consume tu operación en tiempo real sin mockups.
        </p>

        <div className="kpis">
          <div className="kpi"><small>Activos</small><strong>{fleet.metrics.active}</strong></div>
          <div className="kpi"><small>Alertas</small><strong>{fleet.metrics.alerts}</strong></div>
          <div className="kpi"><small>Rutas</small><strong>{fleet.metrics.routes}</strong></div>
          <div className="kpi"><small>Offline</small><strong>{fleet.metrics.offline}</strong></div>
        </div>

        {!connected ? (
          <div className="integration-note">
            <strong>Integración pendiente</strong>
            <p>{message || "Configura GPS_UPSTREAM_URL y GPS_API_KEY para mostrar tu flota real."}</p>
          </div>
        ) : null}
      </div>

      <div className="panel-card">
        <div className="panel-card-head">
          <span>Seguimiento</span>
          <strong>{connected ? "Conectado" : "Sin conexión"}</strong>
        </div>

        <FleetMap vehicles={fleet.vehicles} />

        <div className="panel-bottom">
          <div className="vehicle-summary">
            <small>Unidad principal</small>
            <strong>{latestVehicle?.name || "Sin unidades"}</strong>
            <span>
              {latestVehicle
                ? `${latestVehicle.speed} km/h • ${latestVehicle.geofence || "Sin geocerca"}`
                : "Esperando vehículos conectados"}
            </span>
          </div>

          <div className="alerts-list">
            <small>Actividad reciente</small>
            {fleet.alerts.length === 0 ? (
              <div className="alert-row empty">No hay alertas cargadas.</div>
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
