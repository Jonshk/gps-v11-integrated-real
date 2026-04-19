"use client";

import { useMemo, useState } from "react";

type ScannerVehicle = {
  id: number;
  x: number;
  y: number;
  unit: string;
  status: string;
  speed: string;
};

const scannerVehicles: ScannerVehicle[] = [
  { id: 1, x: 18, y: 28, unit: "Unidad 12", status: "En ruta", speed: "64 km/h" },
  { id: 2, x: 34, y: 56, unit: "Unidad 07", status: "Operativa", speed: "52 km/h" },
  { id: 3, x: 48, y: 38, unit: "Unidad 21", status: "En ruta", speed: "71 km/h" },
  { id: 4, x: 62, y: 64, unit: "Unidad 05", status: "Supervisada", speed: "43 km/h" },
  { id: 5, x: 72, y: 30, unit: "Unidad 18", status: "En ruta", speed: "67 km/h" },
  { id: 6, x: 84, y: 72, unit: "Unidad 03", status: "Monitoreada", speed: "58 km/h" },
];

function getDistance(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function HeroGps() {
  const [pos, setPos] = useState({
    x: 50,
    y: 50,
    active: false,
  });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPos({
      x,
      y,
      active: true,
    });
  }

  function handleLeave() {
    setPos((prev) => ({
      ...prev,
      active: false,
    }));
  }

  const detectedVehicle = useMemo(() => {
    if (!pos.active) return null;

    const threshold = 11;
    let nearest: ScannerVehicle | null = null;
    let minDistance = Infinity;

    for (const vehicle of scannerVehicles) {
      const distance = getDistance(pos.x, pos.y, vehicle.x, vehicle.y);
      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        nearest = vehicle;
      }
    }

    return nearest;
  }, [pos]);

  return (
    <section className="hero-v11 hero-gps">
      <div
        className="hero-media hero-media-gps"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div className="hero-image-base" />
        <div className="hero-overlay" />
        <div className="hero-grid-overlay" />

        <span className="target t1" />
        <span className="target t2" />
        <span className="target t3" />
        <span className="target t4" />

        {scannerVehicles.map((vehicle) => (
          <span
            key={vehicle.id}
            className={`vehicle-hotspot ${
              detectedVehicle?.id === vehicle.id ? "active" : ""
            }`}
            style={{
              left: `${vehicle.x}%`,
              top: `${vehicle.y}%`,
            }}
            aria-hidden="true"
          >
            <span className="vehicle-ping" />
            <span className="vehicle-core" />
          </span>
        ))}

        <div
          className={`hero-scanner ${pos.active ? "active" : ""} ${
            detectedVehicle ? "locked" : ""
          }`}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            backgroundPosition: `${pos.x}% ${pos.y}%`,
          }}
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
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
        />

        {detectedVehicle ? (
          <div
            className="scanner-label active"
            style={{
              left: `${detectedVehicle.x}%`,
              top: `${detectedVehicle.y}%`,
            }}
          >
            <span className="scanner-label-tag">Vehículo detectado</span>
            <strong>{detectedVehicle.unit}</strong>
            <span>{detectedVehicle.status}</span>
            <span>{detectedVehicle.speed}</span>
          </div>
        ) : null}
      </div>

      <div className="hero-content">
        <span className="hero-tag">Seguimiento de vehículos</span>

        <h1>
          LOCALIZA TU FLOTA
          <br />
          Y TOMA CONTROL
          <br />
          EN TIEMPO REAL
        </h1>

        <p>
          Ubica vehículos, reduce pérdidas y gana visibilidad con una plataforma
          pensada para operación real, no para parecer una demo bonita.
        </p>

        <div className="hero-actions">
          <a className="btn btn-primary" href="#contacto">
            Conseguir una demo
          </a>
          <a className="btn btn-secondary" href="#panel">
            Ver panel en vivo
          </a>
        </div>

        <div className="hero-proof">
          <div className="proof-box">
            <strong>24/7</strong>
            <span>Seguimiento continuo</span>
          </div>

          <div className="proof-box">
            <strong>En vivo</strong>
            <span>Ubicación inmediata</span>
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