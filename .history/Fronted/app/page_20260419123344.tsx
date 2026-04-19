import TopBar from "@/components/TopBar";
import Dashboard from "@/components/Dashboard";
import type { FleetPayload } from "@/lib/fleet";

async function getFleetData(): Promise<{ connected: boolean; message?: string; data: FleetPayload }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const response = await fetch(`${base}/api/fleet`, { cache: "no-store" });
    const json = await response.json();
    return {
      connected: Boolean(json.connected),
      message: json.message,
      data: json.data
    };
  } catch {
    return {
      connected: false,
      message: "No se pudo consultar la ruta /api/fleet.",
      data: {
        vehicles: [],
        alerts: [],
        metrics: { active: 0, idle: 0, offline: 0, alerts: 0, routes: 0 }
      }
    };
  }
}

const valueCards = [
  {
    title: "Control operativo",
    text: "Visualiza cada unidad, entiende qué pasó y responde rápido cuando algo se sale de ruta."
  },
  {
    title: "Menos pérdidas",
    text: "Reduce tiempos muertos, movimientos no autorizados y falta de visibilidad en la operación."
  },
  {
    title: "Decisiones rápidas",
    text: "Convierte ubicación, eventos y actividad en decisiones útiles para negocio o flota."
  }
];

const plans = [
  {
    name: "Básico",
    price: "Desde $9,99/mes",
    items: ["Ubicación en tiempo real", "Historial de recorridos", "Acceso móvil", "Soporte básico"]
  },
  {
    name: "Pro",
    price: "Desde $14,99/mes",
    items: ["Todo lo del Básico", "Geocercas", "Alertas avanzadas", "Soporte prioritario"],
    featured: true
  },
  {
    name: "Flotas",
    price: "Cotización",
    items: ["Múltiples unidades", "Resumen operativo", "Control de rutas", "Atención dedicada"]
  }
];

export default async function HomePage() {
  const fleet = await getFleetData();

  return (
    <main className="page-shell">
      <TopBar />

      <section className="hero-v11">
        <div className="hero-media">
          <img src="/hero-roads.svg" alt="Vista aérea abstracta de carreteras" />
          <div className="hero-overlay" />
          <span className="target t1" />
          <span className="target t2" />
          <span className="target t3" />
          <span className="target t4" />
        </div>

        <div className="hero-content">
          <span className="hero-tag">Seguimiento de vehículos</span>
          <h1>
            LOCALIZA TU FLOTA
            <br />
            Y TOMA CONTROL
            <br />
            EN TIEMPO REAL
          </h1>
          <p>
            Ubica vehículos, reduce pérdidas y gana visibilidad con una plataforma pensada
            para operación real, no para parecer una demo bonita.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="#contacto">Conseguir una demo</a>
            <a className="btn btn-secondary" href="#panel">Ver panel en vivo</a>
          </div>

          <div className="hero-proof">
            <div className="proof-box"><strong>24/7</strong><span>Seguimiento continuo</span></div>
            <div className="proof-box"><strong>En vivo</strong><span>Ubicación inmediata</span></div>
            <div className="proof-box"><strong>Alertas</strong><span>Eventos clave</span></div>
          </div>
        </div>
      </section>

      <section id="solucion" className="section intro-strip">
        <div className="intro-copy">
          <span className="eyebrow">Solución</span>
          <h2>No es solo rastreo. Es control operativo.</h2>
          <p>
            Aquí vendes visibilidad, respuesta rápida, menos pérdidas y una operación que por fin se ve seria.
          </p>
        </div>

        <div className="mini-panel">
          <div className="mini-chip">Ubicación en tiempo real</div>
          <div className="mini-chip">Historial de recorridos</div>
          <div className="mini-chip">Geocercas y zonas seguras</div>
          <div className="mini-chip">Alertas por eventos</div>
        </div>
      </section>

      <section id="impacto" className="section cards-section">
        <div className="section-head">
          <span className="eyebrow">Impacto</span>
          <h2>Una estructura pensada para seguridad, control y eficiencia.</h2>
        </div>

        <div className="cards-grid">
          {valueCards.map((card) => (
            <article className="value-card" key={card.title}>
              <div className="icon-dot" />
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <Dashboard fleet={fleet.data} connected={fleet.connected} message={fleet.message} />

      <section id="planes" className="section pricing-section">
        <div className="section-head">
          <span className="eyebrow">Planes</span>
          <h2>Opciones simples para empezar rápido.</h2>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`price-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
              {plan.featured ? <div className="badge">Más solicitado</div> : null}
              <h3>{plan.name}</h3>
              <div className="price">{plan.price}</div>
              <ul>
                {plan.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <a className={plan.featured ? "btn btn-primary full" : "btn btn-secondary full"} href="#contacto">
                Solicitar información
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="contacto" className="section final-cta">
        <div className="cta-box">
          <span className="eyebrow">Activa el control hoy</span>
          <h2>Haz que tu operación se vea seria desde el primer clic.</h2>
          <p>Escribe por WhatsApp y te guiamos con la mejor opción para carro, moto o flota.</p>
          <a className="btn btn-primary" href={`https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_PHONE || "593XXXXXXXXX"}`} target="_blank">
            Hablar por WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
