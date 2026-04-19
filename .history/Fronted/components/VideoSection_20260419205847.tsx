export default function VideoSection() {
  return (
    <section className="video-section">
      <div className="video-section-head">
        <span className="eyebrow-dark">En accion</span>
        <h2>Tu flota, visible en tiempo real desde cualquier lugar.</h2>
        <p>Asi se ve el control operativo cuando tienes GPS Control EC trabajando para ti.</p>
      </div>

      <div className="video-wrap">
        <video
          className="bg-video"
          autoPlay
          muted
          loop
          playsInline
          poster=""
        >
          <source
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            type="video/mp4"
          />
        </video>
        <div className="video-overlay" />
        <div className="video-content">
          <div className="video-badge">
            <span className="live-pulse" />
            Monitoreo 24/7
          </div>
          <div className="video-stats">
            <div className="vstat">
              <strong>+500</strong>
              <span>unidades activas</span>
            </div>
            <div className="vstat-divider" />
            <div className="vstat">
              <strong>99.9%</strong>
              <span>uptime garantizado</span>
            </div>
            <div className="vstat-divider" />
            <div className="vstat">
              <strong>30s</strong>
              <span>tiempo de respuesta</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}