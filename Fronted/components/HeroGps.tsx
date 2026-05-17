"use client";

import { useMemo, useState, useEffect, useRef } from "react";

/* --- Tipos ------------------------------------------- */
type ScannerVehicle = {
  id: number;
  /** posicion actual como % del viewBox (0-100) */
  x: number;
  y: number;
  unit: string;
  status: string;
  speed: string;
  /** indice de ruta asignada */
  routeIdx: number;
  /** progreso sobre la ruta (0-1) */
  progress: number;
  /** velocidad de desplazamiento (progreso/tick) */
  pace: number;
};

/* --- Rutas SVG de carreteras (Guayaquil, coords % viewBox 100-56) --- */
// Cada ruta es array de puntos [x, y] que definen el trayecto
const ROUTES: [number, number][][] = [
  // Av. Francisco de Orellana (eje horizontal norte)
  [[0,14],[12,13],[28,12],[44,11],[60,12],[76,14],[92,13],[100,14]],
  // Av. de las Americas (diagonal NW-SE)
  [[0,28],[18,24],[36,22],[52,28],[64,36],[72,44],[82,52],[92,55]],
  // Malecon / Simon Bolivar (eje horizontal centro)
  [[0,38],[20,37],[40,36],[58,38],[78,40],[100,39]],
  // Av. 9 de Octubre (vertical centro)
  [[46,0],[47,12],[48,26],[47,38],[46,50],[45,56]],
  // Perimetral (arco exterior)
  [[8,56],[6,44],[5,28],[8,14],[18,6],[36,3],[58,4],[78,6],[90,14],[94,28],[92,42],[88,54]],
  // Av. Quito (diagonal SW-NE)
  [[0,52],[14,46],[28,38],[40,28],[52,20],[64,14],[78,8],[90,4]],
];

/* interpola un punto sobre una ruta (progreso 0-1) */
function routePoint(route: [number,number][], t: number): { x: number; y: number } {
  if (route.length < 2) return { x: route[0][0], y: route[0][1] };
  const total = route.length - 1;
  const seg = t * total;
  const i = Math.min(Math.floor(seg), total - 1);
  const frac = seg - i;
  const [ax, ay] = route[i];
  const [bx, by] = route[i + 1];
  return { x: ax + (bx - ax) * frac, y: ay + (by - ay) * frac };
}

/* --- Vehiculos iniciales --------------------------- */
const INITIAL_VEHICLES: Omit<ScannerVehicle, "x"|"y">[] = [
  { id: 1, unit: "Unidad 12", status: "En ruta",      speed: "64 km/h", routeIdx: 0, progress: 0.15, pace: 0.00010 },
  { id: 2, unit: "Unidad 07", status: "Operativa",    speed: "52 km/h", routeIdx: 1, progress: 0.42, pace: 0.00008 },
  { id: 3, unit: "Unidad 21", status: "En ruta",      speed: "71 km/h", routeIdx: 2, progress: 0.70, pace: 0.00013 },
  { id: 4, unit: "Unidad 05", status: "Supervisada",  speed: "43 km/h", routeIdx: 3, progress: 0.28, pace: 0.00006 },
  { id: 5, unit: "Unidad 18", status: "En ruta",      speed: "67 km/h", routeIdx: 4, progress: 0.55, pace: 0.00011 },
  { id: 6, unit: "Unidad 03", status: "Monitoreada",  speed: "58 km/h", routeIdx: 5, progress: 0.80, pace: 0.00009 },
];

function initVehicles(): ScannerVehicle[] {
  return INITIAL_VEHICLES.map((v) => {
    const pt = routePoint(ROUTES[v.routeIdx], v.progress);
    return { ...v, x: pt.x, y: (pt.y / 56) * 100 };
  });
}

function getDistance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/* --- Componente ----------------------------------- */
export default function HeroGps() {
  const [vehicles, setVehicles] = useState<ScannerVehicle[]>(initVehicles);
  const [pos, setPos] = useState({ x: 50, y: 50, active: false });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  /* animar vehiculos por rutas */
  useEffect(() => {
    function tick(ts: number) {
      const dt = ts - lastRef.current;
      lastRef.current = ts;
      if (dt > 200) { rafRef.current = requestAnimationFrame(tick); return; } // tab inactivo

      setVehicles((prev) =>
        prev.map((v) => {
          const newProgress = (v.progress + v.pace * dt) % 1;
          const pt = routePoint(ROUTES[v.routeIdx], newProgress);
          return { ...v, progress: newProgress, x: pt.x, y: (pt.y / 56) * 100 };
        })
      );
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  }

  const detectedVehicle = useMemo(() => {
    if (!pos.active) return null;
    const threshold = 9;
    let nearest: ScannerVehicle | null = null;
    let minDist = Infinity;
    for (const v of vehicles) {
      const d = getDistance(pos.x, pos.y, v.x, v.y);
      if (d < threshold && d < minDist) { minDist = d; nearest = v; }
    }
    return nearest;
  }, [pos, vehicles]);

  return (
    <section className="hero-v11 hero-gps">
      {/* -- Media / mapa -- */}
      <div
        className="hero-media hero-media-gps"
        onMouseMove={handleMove}
        onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      >
        {/* Fondo SVG: mapa de carreteras Guayaquil */}
        <svg
          className="hero-map-svg"
          viewBox="0 0 100 56"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Bloques de zona urbana */}
          <rect x="20" y="8"  width="18" height="10" rx="1" className="map-block"/>
          <rect x="44" y="8"  width="14" height="8"  rx="1" className="map-block"/>
          <rect x="64" y="8"  width="20" height="12" rx="1" className="map-block"/>
          <rect x="8"  y="22" width="16" height="12" rx="1" className="map-block"/>
          <rect x="30" y="24" width="22" height="10" rx="1" className="map-block"/>
          <rect x="58" y="22" width="18" height="12" rx="1" className="map-block"/>
          <rect x="80" y="22" width="16" height="10" rx="1" className="map-block"/>
          <rect x="14" y="40" width="20" height="12" rx="1" className="map-block"/>
          <rect x="40" y="42" width="18" height="10" rx="1" className="map-block"/>
          <rect x="64" y="38" width="22" height="14" rx="1" className="map-block"/>

          {/* Rutas principales */}
          {ROUTES.map((route, i) => (
            <polyline
              key={i}
              points={route.map(([x, y]) => `${x},${y}`).join(" ")}
              className={`map-road ${i < 3 ? "road-main" : "road-sec"}`}
            />
          ))}

          {/* Linea costera / rio */}
          <path
            d="M0,52 Q12,50 24,51 T48,50 T72,52 T100,51"
            className="map-coast"
          />

          {/* Marcadores de vehiculos */}
          {vehicles.map((v) => (
            <g key={v.id} transform={`translate(${v.x},${v.y})`}>
              <circle
                r="1.8"
                className={`veh-core ${detectedVehicle?.id === v.id ? "locked" : ""}`}
              />
              <circle
                r="3.5"
                className={`veh-ping ${detectedVehicle?.id === v.id ? "locked" : ""}`}
              />
            </g>
          ))}
        </svg>

        {/* Overlay de color / profundidad */}
        <div className="hero-overlay" />
        <div className="hero-grid-overlay" />

        {/* Targets decorativos */}
        <span className="target t1" />
        <span className="target t2" />
        <span className="target t3" />
        <span className="target t4" />

        {/* Scanner de mouse */}
        <div
          className={`hero-scanner ${pos.active ? "active" : ""} ${detectedVehicle ? "locked" : ""}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <span className="scanner-ring ring-1" />
          <span className="scanner-ring ring-2" />
          <span className="scanner-cross cross-h" />
          <span className="scanner-cross cross-v" />
          <span className="scanner-dot" />
          <span className="scanner-sweep" />
        </div>

        <div
          className={`hero-glow ${pos.active ? "active" : ""}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        />

        {/* Label al hacer lock */}
        {detectedVehicle && (
          <div
            className="scanner-label active"
            style={{
              left: `${detectedVehicle.x}%`,
              top: `${detectedVehicle.y}%`,
            }}
          >
            <span className="scanner-label-tag">Vehiculo detectado</span>
            <strong>{detectedVehicle.unit}</strong>
            <span>{detectedVehicle.status}</span>
            <span>{detectedVehicle.speed}</span>
          </div>
        )}
      </div>

      {/* -- Contenido -- */}
      <div className="hero-content">
        <span className="hero-tag">Seguimiento de vehiculos</span>

        <h1>
          LOCALIZA TU FLOTA
          <br />Y TOMA CONTROL
          <br />EN TIEMPO REAL
        </h1>

        <p>
          Ubica vehiculos, reduce perdidas y gana visibilidad con una plataforma
          pensada para operacion real, no para parecer una demo bonita.
        </p>

        <div className="hero-actions">
          <a className="btn-hero-primary" href="#contacto">Conseguir una demo</a>
          <a className="btn-hero-ghost" href="#panel">Ver panel en vivo</a>
        </div>

        <div className="hero-proof">
          <div className="proof-box">
            <strong>24/7</strong>
            <span>Seguimiento continuo</span>
          </div>
          <div className="proof-box">
            <strong>En vivo</strong>
            <span>Ubicacion inmediata</span>
          </div>
          <div className="proof-box">
            <strong>Alertas</strong>
            <span>Eventos clave</span>
          </div>
        </div>
      </div>
    </section>
  );
}