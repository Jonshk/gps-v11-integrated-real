const PHONE = "593987654321";

export default function HeroStrip() {
  return (
    <div className="hero-strip">
      <div className="hs-inner">
        <div className="hs-left">
          <div className="hs-badge">
            <span className="hs-dot" />
            En vivo
          </div>
          <h1 className="hs-heading">
            Control GPS para flotas en Ecuador
          </h1>
          <p className="hs-sub">
            Ubica cada vehiculo, recibe alertas al instante y toma decisiones
            con datos reales -- desde un solo panel.
          </p>
        </div>

        <div className="hs-right">
          <div className="hs-proof">
            <div className="hs-proof-item">
              <strong>+200</strong>
              <span>empresas activas</span>
            </div>
            <div className="hs-proof-sep" />
            <div className="hs-proof-item">
              <strong>4.8/5</strong>
              <span>valoracion</span>
            </div>
            <div className="hs-proof-sep" />
            <div className="hs-proof-item">
              <strong>10 min</strong>
              <span>instalacion</span>
            </div>
          </div>
          <div className="hs-actions">
            <a
              href={`https://wa.me/${PHONE}?text=Quiero una demo de GPS Control EC`}
              target="_blank"
              rel="noreferrer"
              className="hs-btn-primary"
            >
              Solicitar demo gratis
            </a>
            <a href="#panel" className="hs-btn-ghost">
              Ver panel en vivo
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Trust bar debajo */}
      <div className="hs-trust">
        <div className="hs-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          4.8 / 5 en satisfaccion
        </div>
        <div className="hs-trust-sep" />
        <div className="hs-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          Sin permanencia ni contratos
        </div>
        <div className="hs-trust-sep" />
        <div className="hs-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
          <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">WhatsApp 24/7</a>
        </div>
        <div className="hs-trust-sep" />
        <div className="hs-trust-item">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
          Guayaquil, Ecuador
        </div>
      </div>
    </div>
  );
}