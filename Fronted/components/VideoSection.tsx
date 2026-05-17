"use client";

import { useState } from "react";

export default function VideoSection() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="vs-section">
      <div className="vs-wrap">
        {!videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="vs-video"
            onError={() => setVideoFailed(true)}
          >
            {/* Coloca tu video en Fronted/public/videos/hero.mp4 */}
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
        ) : (
          /* Fallback: mapa animado CSS mientras no hay video */
          <div className="vs-fallback">
            <div className="vs-fallback-map" />
            <div className="vs-fallback-car c1" />
            <div className="vs-fallback-car c2" />
            <div className="vs-fallback-car c3" />
          </div>
        )}

        <div className="vs-overlay" />

        <div className="vs-live-chip">
          <span className="vs-live-dot" />
          Monitoreo en tiempo real
        </div>

        <div className="vs-copy">
          <p className="vs-eyebrow">GPS Control EC en accion</p>
          <h2>Cada vehiculo.<br />Cada ruta.<br />En tiempo real.</h2>
          <a
            href="https://wa.me/593987654321?text=Quiero una demo"
            target="_blank"
            rel="noreferrer"
            className="vs-cta"
          >
            Ver como funciona
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>

        <div className="vs-stats">
          <div className="vs-stat">
            <strong>+500</strong>
            <span>unidades activas</span>
          </div>
          <div className="vs-stat-sep" />
          <div className="vs-stat">
            <strong>99.9%</strong>
            <span>uptime</span>
          </div>
          <div className="vs-stat-sep" />
          <div className="vs-stat">
            <strong>30s</strong>
            <span>alerta promedio</span>
          </div>
        </div>
      </div>
    </section>
  );
}