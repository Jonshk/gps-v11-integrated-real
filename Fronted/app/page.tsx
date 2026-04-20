import TopBar from "@/components/TopBar";
import Dashboard from "@/components/Dashboard";
import VideoHero from "@/components/VideoHero";
import Footer from "@/components/Footer";
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
    body: "Notificacion inmediata si un vehiculo sale de zona o se detiene sin aviso.",
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

export default async function HomePage() {
  const fleet = await getFleetData();

  return (
    <main className="page-shell">
      <TopBar />

      {/* Hero -- video pantalla completa */}
      <VideoHero />

      {/* 3. Por que nosotros */}
      <section id="solucion" className="section section-white">
        <div className="outcomes-header">
          <span className="eyebrow-red">Por que GPS Control EC</span>
          <h2>No vendemos rastreo. Vendemos control.</h2>
          <p className="outcomes-sub">Resultados reales en menos de 30 dias.</p>
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
          {["GPS tiempo real","Geocercas","Alertas push","Historial rutas","App movil","Reportes"].map(f => (
            <div className="feat-chip" key={f}>
              <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Dashboard */}
      <Dashboard fleet={fleet.data} connected={fleet.connected} message={fleet.message} />

      {/* 5. Planes */}
      <section id="planes" className="section section-white">
        <div className="outcomes-header">
          <span className="eyebrow-red">Planes</span>
          <h2>Sin contratos. Cancela cuando quieras.</h2>
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
                href={`https://wa.me/${PHONE}?text=Quiero el plan ${plan.name}`}
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

      {/* 6. CTA final */}
      <section id="contacto" className="section section-dark-cta">
        <div className="cta-inner">
          <div className="cta-copy">
            <span className="eyebrow-light">Empieza hoy</span>
            <h2>Tu flota bajo control desde el primer dia.</h2>
            <p>Instalacion incluida. Soporte en espanol. Sin letra pequenia.</p>
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