"use client";

import { useRef, useEffect, useState } from "react";

const PHONE = "593987654321";

export default function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.85;
  }, []);

  return (
    <section className="vh-section">
      {/* VIDEO DE FONDO -- pon tu archivo en Fronted/public/videos/hero.mp4 */}
      <video
        ref={videoRef}
        className={`vh-video ${loaded ? "loaded" : ""}`}
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setLoaded(true)}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Fondo negro mientras carga el video */}
      <div className="vh-bg-fallback" />

      {/* Overlay */}
      <div className="vh-overlay" />

      {/* Badge arriba derecha */}
      <div className="vh-live-badge">
        <span className="vh-live-dot" />
        Seguimiento activo 24/7
      </div>

      {/* Contenido principal */}
      <div className="vh-content">
        <div className="vh-top-label">GPS Control EC</div>

        <h1 className="vh-title">
          Tu flota<br />
          visible.<br />
          En tiempo<br />
          real.
        </h1>

        <p className="vh-sub">
          Ubica cada vehiculo, recibe alertas al instante
          y toma decisiones con datos reales.
        </p>

        <div className="vh-actions">
          <a
            href={`https://wa.me/${PHONE}?text=Quiero una demo de GPS Control EC`}
            target="_blank"
            rel="noreferrer"
            className="vh-btn-primary"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.847L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.214-3.727.977.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/>
            </svg>
            Solicitar demo gratis
          </a>
          <a href="#panel" className="vh-btn-ghost">
            Ver panel en vivo
          </a>
        </div>
      </div>

      {/* Stats abajo derecha */}
      <div className="vh-stats">
        <div className="vh-stat">
          <strong>+200</strong>
          <span>empresas</span>
        </div>
        <div className="vh-sep" />
        <div className="vh-stat">
          <strong>99.9%</strong>
          <span>uptime</span>
        </div>
        <div className="vh-sep" />
        <div className="vh-stat">
          <strong>10 min</strong>
          <span>instalacion</span>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="vh-scroll">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </section>
  );
}