import TopBar from "@/components/TopBar";
import Dashboard from "@/components/Dashboard";
import HeroGps from "@/components/HeroGps";
import Footer from "@/components/Footer";
import VideoSection from "@/components/VideoSection";
import type { FleetPayload } from "@/lib/fleet";

async function getFleetData(): Promise<{ connected: boolean; message?: string; data: FleetPayload }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/fleet`, { cache: "no-store" });
    const json = await res.json();
    return { connected: Boolean(json.connected), message: json.message, data: json.data };
  } catch {
    return {
      connected: false,
      message: "No se pudo consultar /api/fleet.",
      data: { vehicles: [], alerts: [], metrics: { active: 0, idle: 0, offline: 0, alerts: 0, routes: 0 } },
    };
  }
}

const valueCards = [
  {
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    stat: "100%",
    statLabel: "cobertura Ecuador",
    title: "Siempre conectado",
    text: "Cobertura nacional en Ecuador. Tu flota visible en tiempo real sin importar donde este.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    stat: "-40%",
    statLabel: "costos operativos",
    title: "Menos perdidas",
    text: "Elimina tiempos muertos, rutas ineficientes y movimientos no autorizados de tu operacion.",
  },
  {
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    stat: "<30s",
    statLabel: "alerta en tiempo real",
    title: "Alertas instantaneas",
    text: "Recibe notificaciones al instante cuando algo se sale del plan. Actua antes de que sea tarde.",
  },
];

const plans = [
  {
    name: "Basico",
    price: "$9,99",
    period: "/mes USD",
    desc: "1 vehiculo. Para empezar hoy.",
    items: ["GPS en tiempo real", "Historial 30 dias", "App movil", "Soporte por email"],
  },
  {
    name: "Pro",
    price: "$14,99",
    period: "/mes USD",
    desc: "Hasta 5 vehiculos. El mas solicitado.",
    featured: true,
    items: ["Todo lo del Basico", "Geocercas ilimitadas", "Alertas avanzadas", "Soporte prioritario 24/7"],
  },
  {
    name: "Flotas",
    price: "A medida",
    period: "",
    desc: "Mas de 5 vehiculos. Precio por unidad.",
    items: ["Unidades ilimitadas", "Panel operativo", "Integracion API", "Atencion dedicada"],
  },
];

const PHONE = "593987654321";
const EMAIL = "contacto@gpscontrolec.com";

export default async function HomePage() {
  const fleet = await getFleetData();

  return (
    <main className="page-shell">
      <TopBar />

      {/* Barra de prueba social */}
      <div className="social-proof-bar">
        <div className="sp-item">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <strong>4.8/5</strong>
          <span>+200 clientes satisfechos</span>
        </div>
        <div className="sp-sep" />
        <div className="sp-item">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          <span>Instalacion en menos de 10 minutos</span>
        </div>
        <div className="sp-sep" />
        <div className="sp-item">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
          <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">WhatsApp 24/7</a>
        </div>
        <div className="sp-sep" />
        <div className="sp-item">
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
          <span>Guayaquil, Ecuador</span>
        </div>
      </div>

      <HeroGps />

      {/* Solucion */}
      <section id="solucion" className="section intro-strip">
        <div className="intro-copy">
          <span className="eyebrow">Solucion</span>
          <h2>No es solo rastreo. Es control operativo.</h2>
          <p>Visibilidad real sobre tu flota en Ecuador. Respuesta rapida, menos perdidas, operacion que se ve seria.</p>
        </div>
        <div className="mini-panel">
          <div className="mini-chip">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            Ubicacion en tiempo real
          </div>
          <div className="mini-chip">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
            Historial de recorridos
          </div>
          <div className="mini-chip">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
            Alertas por eventos
          </div>
          <div className="mini-chip">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"/></svg>
            Geocercas y zonas seguras
          </div>
        </div>
      </section>

      {/* Impacto */}
      <section id="impacto" className="section cards-section">
        <div className="section-head">
          <span className="eyebrow">Impacto</span>
          <h2>Resultados reales desde el primer dia.</h2>
        </div>
        <div className="cards-grid">
          {valueCards.map((card) => (
            <article className="value-card" key={card.title}>
              <div className="card-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={card.icon} />
                </svg>
              </div>
              <div className="card-stat">
                <strong>{card.stat}</strong>
                <span>{card.statLabel}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Video */}
      <VideoSection />

      {/* Dashboard */}
      <Dashboard fleet={fleet.data} connected={fleet.connected} message={fleet.message} />

      {/* Planes */}
      <section id="planes" className="section pricing-section">
        <div className="section-head">
          <span className="eyebrow">Planes</span>
          <h2>Empieza hoy. Sin permanencia.</h2>
          <p className="section-sub">Cancela cuando quieras. Sin contratos. Sin letra pequena.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.featured ? <div className="badge">Mas popular</div> : null}
              <h3>{plan.name}</h3>
              <p className="plan-desc">{plan.desc}</p>
              <div className="price">
                {plan.price}
                {plan.period && <span className="price-period">{plan.period}</span>}
              </div>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                className={plan.featured ? "btn btn-primary full" : "btn btn-outline full"}
                href={`https://wa.me/${PHONE}?text=Quiero el plan ${plan.name}`}
                target="_blank" rel="noreferrer"
              >
                {plan.name === "Flotas" ? "Solicitar cotizacion" : "Empezar ahora"}
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section id="contacto" className="section final-cta">
        <div className="cta-box">
          <span className="eyebrow">Empieza hoy</span>
          <h2>Tu flota bajo control desde el primer dia.</h2>
          <p>Instalacion incluida. Sin permanencia. Soporte en espaniol.</p>
          <div className="cta-actions">
            <a
              className="btn btn-primary btn-lg"
              href={`https://wa.me/${PHONE}?text=Hola, quiero una demo de GPS Control EC`}
              target="_blank" rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{width:20,height:20}}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.847L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.214-3.727.977.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/>
              </svg>
              Hablar por WhatsApp
            </a>
            <a className="btn btn-ghost btn-lg" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}