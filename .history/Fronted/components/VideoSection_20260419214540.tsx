export default function VideoSection() {
  return (
    <section className="vs-section">
      <div className="vs-wrap">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="vs-video"
        >
          {/* Carretera nocturna timelapse -- aspecto cinematico */}
          <source
            src="https://videos.pexels.com/video-files/2103099/2103099-uhd_2732_1440_24fps.mp4"
            type="video/mp4"
          />
          <source
            src="https://videos.pexels.com/video-files/1539231/1539231-hd_1920_1080_24fps.mp4"
            type="video/mp4"
          />
        </video>

        {/* Overlay lateral izquierdo para que el copy sea legible */}
        <div className="vs-overlay" />

        {/* Badge en vivo */}
        <div className="vs-live-chip">
          <span className="vs-live-dot" />
          Monitoreo en tiempo real
        </div>

        {/* Copy sobre el video */}
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

        {/* Stats en la esquina inferior derecha */}
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