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
      data: { vehicles: [], alerts: [], metrics: { active: 0, idle: 0, offline: 0, alerts: 0, routes: 0 } },
    };
  }
}

const outcomes = [
  {
    icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    stat: "100%",
    label: "visibilidad",
    heading: "Sabes donde esta cada vehiculo",
    body: "En todo momento, aunque no estes. Sin llamar al conductor, sin esperar reporte.",
  },
  {
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    stat: "-40%",
    label: "costos",
    heading: "Menos combustible y tiempo perdido",
    body: "Rutas mas eficientes, menos desvios no autorizados, menos horas muertas.",
  },
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    stat: "30s",
    label: "alerta",
    heading: "Reaccion antes de que sea tarde",
    body: "Notificacion inmediata si un vehiculo sale de la zona permitida o se detiene sin aviso.",
  },
];

const plans = [
  {
    name: "Basico",
    price: "$9,99",
    sub: "/mes por vehiculo",
    desc: "Para empezar hoy mismo.",
    items: ["1 vehiculo incluido", "GPS en tiempo real", "Historial 30 dias", "App movil iOS y Android", "Soporte por email"],
    cta: "Empezar",
  },
  {
    name: "Pro",
    price: "$14,99",
    sub: "/mes por vehiculo",
    desc: "El plan mas solicitado.",
    featured: true,
    items: ["Hasta 10 vehiculos", "Geocercas ilimitadas", "Alertas SMS y push", "Soporte prioritario 24/7", "Reportes automaticos"],
    cta: "Empezar",
  },
  {
    name: "Flotas",
    price: "A medida",
    sub: "precio por volumen",
    desc: "Para operaciones grandes.",
    items: ["Vehiculos ilimitados", "Panel operativo avanzado", "Integracion API", "Gestor de cuenta dedicado", "SLA garantizado"],
    cta: "Cotizar",
  },
];

const PHONE = "593987654321";
const EMAIL = "contacto@gpscontrolec.com";
const MAPS = "https://maps.google.com/?q=Guayaquil,Ecuador";

export default async function HomePage() {
  const fleet = await getFleetData();

  return (
    <main className="page-shell">
      <TopBar />

      {/* Barra de confianza */}
      <div className="trust-bar">
        <div className="trust-inner">
          <div className="trust-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span><strong>4.8 / 5</strong> -- +200 empresas en Ecuador</span>
          </div>
          <div className="trust-sep" />
          <div className="trust-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span>Instalacion incluida en menos de 10 minutos</span>
          </div>
          <div className="trust-sep" />
          <div className="trust-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            <a href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">Soporte WhatsApp 24/7</a>
          </div>
          <div className="trust-sep" />
          <div className="trust-item">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            <a href={MAPS} target="_blank" rel="noreferrer">Guayaquil, Ecuador</a>
          </div>
        </div>
      </div>

      <HeroGps />

      {/* Por que nosotros */}
      <section id="solucion" className="section section-white">
        <div className="outcomes-header">
          <span className="eyebrow-red">Por que GPS Control EC</span>
          <h2>No vendemos rastreo.<br />Vendemos control.</h2>
          <p className="outcomes-sub">Cada empresario que contrata GPS Control EC reduce perdidas en menos de 30 dias. Estos son los resultados reales.</p>
        </div>
        <div className="outcomes-grid" id="impacto">
          {outcomes.map((o) => (
            <div className="outcome-card" key={o.heading}>
              <div className="outcome-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={o.icon} />
                </svg>
              </div>
              <div className="outcome-stat">
                <span className="outcome-number">{o.stat}</span>
                <span className="outcome-label">{o.label}</span>
              </div>
              <h3>{o.heading}</h3>
              <p>{o.body}</p>
            </div>
          ))}
        </div>
        <div className="features-strip">
          <div className="feat-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            Ubicacion GPS tiempo real
          </div>
          <div className="feat-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd"/></svg>
            Geocercas y zonas seguras
          </div>
          <div className="feat-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
            Alertas en tiempo real
          </div>
          <div className="feat-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
            Historial de recorridos
          </div>
          <div className="feat-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd"/></svg>
            App movil iOS y Android
          </div>
          <div className="feat-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
            Reportes y estadisticas
          </div>
        </div>
      </section>

      {/* Video */}
      <VideoSection />

      {/* Panel */}
      <Dashboard fleet={fleet.data} connected={fleet.connected} message={fleet.message} />

      {/* Planes */}
      <section id="planes" className="section section-white">
        <div className="outcomes-header">
          <span className="eyebrow-red">Planes</span>
          <h2>Sin contratos. Sin permanencia.<br />Cancela cuando quieras.</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.featured && <div className="plan-badge">Mas popular</div>}
              <div className="plan-top">
                <h3>{plan.name}</h3>
                <p className="plan-desc">{plan.desc}</p>
              </div>
              <div className="plan-price">
                <span className="price-num">{plan.price}</span>
                <span className="price-sub">{plan.sub}</span>
              </div>
              <ul className="plan-features">
                {plan.items.map((item) => (
                  <li key={item}>
                    <svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/${PHONE}?text=Quiero el plan ${plan.name} de GPS Control EC`}
                target="_blank"
                rel="noreferrer"
                className={plan.featured ? "btn-plan-primary" : "btn-plan-outline"}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section id="contacto" className="section section-dark-cta">
        <div className="cta-inner">
          <div className="cta-copy">
            <span className="eyebrow-light">Empieza hoy</span>
            <h2>Tu flota bajo control desde el primer dia.</h2>
            <p>Instalacion incluida. Soporte en espanol. Sin letra pequenya.</p>
          </div>
          <div className="cta-actions">
            <a
              href={`https://wa.me/${PHONE}?text=Hola, quiero empezar con GPS Control EC`}
              target="_blank"
              rel="noreferrer"
              className="cta-btn-primary"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.847L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.214-3.727.977.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/>
              </svg>
              Solicitar demo por WhatsApp
            </a>
            <a href={`tel:+${PHONE}`} className="cta-btn-ghost">+593 98 765 4321</a>
            <a href={`mailto:${EMAIL}`} className="cta-btn-ghost">{EMAIL}</a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}