export default function VideoSection() {
  return (
    <section className="video-section">
      <div className="video-wrap-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="video-bg"
        >
          {/* Timelapse de autopista nocturna -- Pexels free */}
          <source
            src="https://videos.pexels.com/video-files/3843434/3843434-uhd_2560_1440_25fps.mp4"
            type="video/mp4"
          />
          {/* Fallback: ciudad nocturna */}
          <source
            src="https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_30fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="video-dark-overlay" />

        <div className="video-content-box">
          <div className="video-left">
            <span className="video-eyebrow">
              <span className="live-dot-video" />
              Monitoreo activo 24/7
            </span>
            <h2>Tu flota visible<br />en tiempo real.</h2>
            <p>Mientras tu operacion avanza, GPS Control EC registra cada movimiento. Sin llamadas, sin incertidumbre.</p>
          </div>
          <div className="video-right">
            <div className="video-stat-card">
              <span className="vsc-num">+500</span>
              <span className="vsc-label">unidades activas en Ecuador</span>
            </div>
            <div className="video-stat-card">
              <span className="vsc-num">99.9%</span>
              <span className="vsc-label">uptime garantizado</span>
            </div>
            <div className="video-stat-card">
              <span className="vsc-num">30s</span>
              <span className="vsc-label">tiempo de alerta promedio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}