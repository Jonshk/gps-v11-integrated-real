export default function VideoSection() {
  return (
    <section className="video-section">
      <div className="video-inner">
        <div className="video-copy">
          <span className="eyebrow-light">En operacion</span>
          <h2>Tu flota visible en tiempo real,<br/>desde cualquier lugar.</h2>
          <p>Asi se ve el control operativo cuando tienes GPS Control EC trabajando para ti. Sin complicaciones, sin papel, sin incertidumbre.</p>
          <div className="video-proof-row">
            <div className="vp-item">
              <strong>+500</strong>
              <span>unidades activas</span>
            </div>
            <div className="vp-item">
              <strong>99.9%</strong>
              <span>uptime</span>
            </div>
            <div className="vp-item">
              <strong>Ecuador</strong>
              <span>cobertura nacional</span>
            </div>
          </div>
        </div>

        <div className="video-frame">
          <video
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
          <div className="video-frame-overlay" />
          <div className="video-live-badge">
            <span className="live-dot-badge" />
            Monitoreo 24/7
          </div>
        </div>
      </div>
    </section>
  );
}