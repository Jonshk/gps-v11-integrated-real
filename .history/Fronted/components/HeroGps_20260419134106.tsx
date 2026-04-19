"use client";

import { useState } from "react";

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

  return (
    <section className="hero-v11 hero-gps">
      <div
        className="hero-media hero-media-gps"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div className="hero-image-base" />
        <div className="hero-overlay" />

        <span className="target t1" />
        <span className="target t2" />
        <span className="target t3" />
        <span className="target t4" />

        <div
          className={`hero-scanner ${pos.active ? "active" : ""}`}
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
        </div>

        <div
          className={`hero-glow ${pos.active ? "active" : ""}`}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
        />
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