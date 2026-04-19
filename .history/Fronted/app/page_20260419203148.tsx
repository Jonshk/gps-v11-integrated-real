import TopBar from "@/components/TopBar";
import Dashboard from "@/components/Dashboard";
import HeroGps from "@/components/HeroGps";
import Footer from "@/components/Footer";
import type { FleetPayload } from "@/lib/fleet";

async function getFleetData(): Promise<{ connected: boolean; message?: string; data: FleetPayload }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${base}/api/fleet`, { cache: "no-store" });
    const json = await response.json();
    return { connected: Boolean(json.connected), message: json.message, data: json.data };
  } catch {
    return {
      connected: false,
      message: "No se pudo consultar la ruta /api/fleet.",
      data: { vehicles: [], alerts: [], metrics: { active: 0, idle: 0, offline: 0, alerts: 0, routes: 0 } },
    };
  }
}

const valueCards = [
  {
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    stat: "100%",
    statLabel: "cobertura 24/7",
    title: "Control operativo",
    text: "Visualiza cada unidad, entiende que paso y responde rapido cuando algo se sale de ruta.",
  },
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    stat: "-40%",
    statLabel: "perdidas operativas",
    title: "Menos perdidas",
    text: "Reduce tiempos muertos, movimientos no autorizados y falta de visibilidad en la operacion.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    stat: "<30s",
    statLabel: "tiempo de respuesta",
    title: "Decisiones rapidas",
    text: "Convierte ubicacion, eventos y actividad en decisiones utiles para negocio o flota.",
  },
];

const plans = [
  {
    name: "Basico",
    price: "$9,99",
    period: "/mes USD",
    desc: "Para empezar a monitorear rapido.",
    items: ["Ubicacion en tiempo real", "Historial de recorridos", "Acceso movil", "Soporte basico"],
  },
  {
    name: "Pro",
    price: "$14,99",
    period: "/mes USD",
    desc: "El mas solicitado por flotas medianas.",
    featured: true,
    items: ["Todo lo del Basico", "Geocercas ilimitadas", "Alertas avanzadas", "Soporte prioritario"],
  },
  {
    name: "Flotas",
    price: "A medida",
    period: "cotizar",
    desc: "Para operaciones grandes con varias unidades.",
    items: ["Multiples unidades", "Resumen operativo", "Control de rutas", "Atencion dedicada"],
  },
];

const PHONE = "593987654321";
const EMAIL = "contacto@gpscontrolec.com";
const ADDRESS = "Guayaquil, Ecuador";
const MAPS_URL = "https://maps.google.com/?q=Guayaquil,Ecuador";

export default async function HomePage() {
  const fleet = await getFleetData();

  return (
    <main className="page-shell">
      <TopBar />
      <HeroGps />

      {/* Solucion */}
      <section id="solucion" className="section intro-strip">
        <div className="intro-copy">
          <span className="eyebrow">Solucion</span>
          <h2>No es solo rastreo. Es control operativo.</h2>
          <p>
            Visibilidad real sobre tu flota en Guayaquil y Ecuador.
            Respuesta rapida, menos perdidas, operacion que se ve seria.
          </p>
          <div className="contact-row">
            <a href={`tel:+${PHONE}`} className="contact-link">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              +593 98 765 4321
            </a>
            <a href={`mailto:${EMAIL}`} className="contact-link">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
              {EMAIL}
            </a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="contact-link">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              {ADDRESS}
            </a>
          </div>
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
          <h2>Resultados medibles desde el primer dia.</h2>
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

      {/* Dashboard */}
      <Dashboard fleet={fleet.data} connected={fleet.connected} message={fleet.message} />

      {/* Planes */}
      <section id="planes" className="section pricing-section">
        <div className="section-head">
          <span className="eyebrow">Planes</span>
          <h2>Opciones simples para empezar rapido.</h2>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.featured ? <div className="badge">Mas solicitado</div> : null}
              <h3>{plan.name}</h3>
              <p className="plan-desc">{plan.desc}</p>
              <div className="price">
                {plan.price}
                <span className="price-period">{plan.period}</span>
              </div>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}>
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                className={plan.featured ? "btn btn-primary full" : "btn btn-secondary full"}
                href={`https://wa.me/${PHONE}?text=Hola, me interesa el plan ${plan.name}`}
                target="_blank"
                rel="noreferrer"
              >
                Solicitar informacion
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section id="contacto" className="section final-cta">
        <div className="cta-box">
          <span className="eyebrow">Activa el control hoy</span>
          <h2>Haz que tu operacion se vea seria desde el primer clic.</h2>
          <p>
            Escribenos por WhatsApp y te guiamos con la mejor opcion
            para carro, moto o flota en Ecuador.
          </p>
          <div className="cta-contact-grid">
            <a href={`tel:+${PHONE}`} className="cta-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.42 12.29 19.79 19.79 0 01.36 3.74 2 2 0 012.34 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-.78a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <span>+593 98 765 4321</span>
            </a>
            <a href={`mailto:${EMAIL}`} className="cta-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>{EMAIL}</span>
            </a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="cta-contact-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{ADDRESS}</span>
            </a>
          </div>
          <div className="cta-actions">
            <a
              className="btn btn-primary btn-lg"
              href={`https://wa.me/${PHONE}?text=Hola, quiero una demo de GPS Control EC`}
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 20, height: 20 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.847L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.214-3.727.977.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z" />
              </svg>
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}