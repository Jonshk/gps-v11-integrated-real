import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — GPS Control EC",
  description: "Conoce cómo GPS Control EC recopila, usa y protege tus datos personales.",
};

const LAST_UPDATE = "1 de junio de 2025";
const EMAIL = "contacto@gpscontrolec.com";
const COMPANY = "GPS Control EC";

export default function PrivacyPage() {
  return (
    <>
      <TopBar />
      <main style={{ paddingTop: 64 }}>
        <section className="legal-hero">
          <div className="legal-hero-inner">
            <span className="legal-badge">Legal</span>
            <h1>Política de Privacidad</h1>
            <p>Última actualización: {LAST_UPDATE}</p>
          </div>
        </section>
        <section className="legal-body">
          <div className="legal-container">
            <div className="legal-alert">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span>Al usar nuestros servicios, aceptas esta política. Te recomendamos leerla con atención.</span>
            </div>
            <div className="legal-toc">
              <p className="legal-toc-title">Contenido</p>
              <ol>
                <li><a href="#datos">Datos que recopilamos</a></li>
                <li><a href="#uso">Cómo usamos tu información</a></li>
                <li><a href="#ubicacion">Datos de ubicación GPS</a></li>
                <li><a href="#terceros">Compartir con terceros</a></li>
                <li><a href="#seguridad">Seguridad de los datos</a></li>
                <li><a href="#retencion">Retención de datos</a></li>
                <li><a href="#derechos">Tus derechos</a></li>
                <li><a href="#cookies">Cookies</a></li>
                <li><a href="#menores">Menores de edad</a></li>
                <li><a href="#cambios">Cambios a esta política</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ol>
            </div>
            <article className="legal-article">
              <section id="datos">
                <h2><span className="legal-num">1.</span> Datos que recopilamos</h2>
                <p>{COMPANY} recopila información necesaria para prestar el servicio de rastreo GPS y gestión de flotas.</p>
                <h3>Información de cuenta</h3>
                <ul>
                  <li>Nombre completo o razón social</li>
                  <li>Correo electrónico y número de teléfono</li>
                  <li>Contraseña (almacenada de forma cifrada, nunca en texto plano)</li>
                  <li>Información de facturación (ciudad, RUC o cédula, según aplique)</li>
                </ul>
                <h3>Datos de vehículos y dispositivos</h3>
                <ul>
                  <li>Placa, marca, modelo y año del vehículo</li>
                  <li>Identificador del dispositivo GPS (IMEI)</li>
                  <li>Número SIM del rastreador (no se comparte con terceros)</li>
                </ul>
                <h3>Datos de uso</h3>
                <ul>
                  <li>Dirección IP y tipo de navegador</li>
                  <li>Páginas visitadas dentro del panel y tiempos de sesión</li>
                  <li>Acciones en la plataforma (inicio de sesión, comandos enviados, alertas gestionadas)</li>
                </ul>
              </section>
              <section id="uso">
                <h2><span className="legal-num">2.</span> Cómo usamos tu información</h2>
                <p>Usamos tus datos exclusivamente para:</p>
                <ul>
                  <li>Proveer, mantener y mejorar el servicio de rastreo GPS</li>
                  <li>Autenticar tu identidad y proteger tu cuenta</li>
                  <li>Enviar alertas y notificaciones relacionadas con tu flota</li>
                  <li>Responder a solicitudes de soporte técnico</li>
                  <li>Cumplir con obligaciones legales y fiscales en Ecuador</li>
                  <li>Detectar y prevenir fraudes o usos no autorizados</li>
                </ul>
                <p><strong>No utilizamos tus datos</strong> para publicidad de terceros ni para crear perfiles de comportamiento con fines comerciales ajenos al servicio.</p>
              </section>
              <section id="ubicacion">
                <h2><span className="legal-num">3.</span> Datos de ubicación GPS</h2>
                <p>El servicio principal de {COMPANY} implica la recopilación continua de coordenadas geográficas de los dispositivos GPS instalados en tus vehículos.</p>
                <ul>
                  <li>La ubicación se registra y almacena en servidores seguros</li>
                  <li>El historial de posiciones se conserva según el plan contratado (mínimo 30 días)</li>
                  <li>Solo tú y los usuarios que autorices pueden ver la ubicación de tus vehículos</li>
                  <li>Los datos de ubicación <strong>nunca se venden</strong> ni ceden a terceros sin tu consentimiento expreso</li>
                </ul>
                <p>El Servicio utiliza mensajes SMS entre nuestra plataforma y el dispositivo GPS (no el teléfono personal del usuario) para el envío de comandos y recepción de reportes de estado. No compartimos ni vendemos los números SIM de los dispositivos a terceros para fines de marketing.</p>
              </section>
              <section id="terceros">
                <h2><span className="legal-num">4.</span> Compartir con terceros</h2>
                <p>{COMPANY} no vende, alquila ni comercializa tu información personal. Podemos compartir datos únicamente en estos casos:</p>
                <ul>
                  <li><strong>Proveedores de infraestructura:</strong> Render (backend), Vercel (frontend) y Twilio (SMS). Procesan datos solo para prestar el servicio.</li>
                  <li><strong>Requerimiento legal:</strong> si una autoridad competente ecuatoriana lo solicita mediante orden judicial válida.</li>
                  <li><strong>Protección de derechos:</strong> cuando sea necesario para proteger los derechos o seguridad de {COMPANY}, sus clientes o el público.</li>
                </ul>
              </section>
              <section id="seguridad">
                <h2><span className="legal-num">5.</span> Seguridad de los datos</h2>
                <ul>
                  <li>Transmisión cifrada mediante HTTPS/TLS en todas las comunicaciones</li>
                  <li>Contraseñas almacenadas con hash seguro (bcrypt)</li>
                  <li>Autenticación mediante tokens JWT con expiración</li>
                  <li>Acceso restringido a bases de datos solo desde servidores autorizados</li>
                </ul>
                <p>En caso de detectar una brecha de seguridad que afecte tus datos, te notificaremos en un plazo máximo de 72 horas.</p>
              </section>
              <section id="retencion">
                <h2><span className="legal-num">6.</span> Retención de datos</h2>
                <ul>
                  <li>Mientras tu cuenta esté activa</li>
                  <li>Obligaciones legales y contables (mínimo 7 años, normativa ecuatoriana)</li>
                  <li>Resolución de disputas o reclamaciones pendientes</li>
                </ul>
                <p>Al cancelar tu cuenta, eliminaremos o anonimizaremos tus datos en un plazo de 30 días.</p>
              </section>
              <section id="derechos">
                <h2><span className="legal-num">7.</span> Tus derechos (LOPDP Ecuador)</h2>
                <ul>
                  <li><strong>Acceso:</strong> solicitar una copia de tus datos</li>
                  <li><strong>Rectificación:</strong> corregir datos inexactos</li>
                  <li><strong>Eliminación:</strong> solicitar la supresión de tus datos</li>
                  <li><strong>Oposición:</strong> oponerte a determinados tratamientos</li>
                  <li><strong>Portabilidad:</strong> recibir tus datos en formato legible por máquina</li>
                </ul>
                <p>Escríbenos a <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Respondemos en máximo 15 días hábiles.</p>
              </section>
              <section id="cookies">
                <h2><span className="legal-num">8.</span> Cookies</h2>
                <ul>
                  <li><strong>Sesión:</strong> mantienen tu inicio de sesión activo</li>
                  <li><strong>Preferencias:</strong> guardan configuraciones de interfaz</li>
                </ul>
                <p>No usamos cookies publicitarias. Puedes deshabilitarlas desde tu navegador.</p>
              </section>
              <section id="menores">
                <h2><span className="legal-num">9.</span> Menores de edad</h2>
                <p>El servicio está dirigido a personas mayores de 18 años. No recopilamos datos de menores de edad intencionalmente.</p>
              </section>
              <section id="cambios">
                <h2><span className="legal-num">10.</span> Cambios a esta política</h2>
                <p>Cuando realicemos cambios significativos, te notificaremos por correo con al menos 15 días de anticipación.</p>
              </section>
              <section id="contacto">
                <h2><span className="legal-num">11.</span> Contacto</h2>
                <div className="legal-contact-card">
                  <div>
                    <strong>GPS Control EC</strong>
                    <span>Guayaquil, Ecuador</span>
                  </div>
                  <div>
                    <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                    <a href="https://wa.me/593987654321" target="_blank" rel="noreferrer">WhatsApp: +593 98 765 4321</a>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </section>
      </main>
      <Footer />
      <style>{`
        .legal-hero { background:var(--dark); padding:72px 24px 56px; text-align:center; border-bottom:1px solid rgba(255,255,255,.06); }
        .legal-hero-inner { max-width:640px; margin:0 auto; }
        .legal-badge { display:inline-block; font-size:.72rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--teal); background:var(--teal-dim); border:1px solid rgba(0,212,160,.25); border-radius:var(--r999); padding:4px 12px; margin-bottom:20px; }
        .legal-hero h1 { font-size:clamp(1.75rem,4vw,2.75rem); font-weight:800; color:var(--text-light); letter-spacing:-.02em; margin-bottom:12px; }
        .legal-hero p { color:var(--muted-light); font-size:.9rem; }
        .legal-body { background:var(--gray-50); padding:64px 24px 96px; }
        .legal-container { max-width:780px; margin:0 auto; }
        .legal-alert { display:flex; align-items:flex-start; gap:12px; background:rgba(0,212,160,.08); border:1px solid rgba(0,212,160,.2); border-radius:var(--r12); padding:16px 20px; margin-bottom:36px; font-size:.9rem; color:var(--gray-700); line-height:1.5; }
        .legal-alert svg { width:20px; height:20px; color:var(--teal); flex-shrink:0; margin-top:1px; }
        .legal-toc { background:var(--white); border:1px solid var(--gray-200); border-radius:var(--r12); padding:24px 28px; margin-bottom:48px; }
        .legal-toc-title { font-size:.75rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-bottom:14px; }
        .legal-toc ol { padding-left:20px; display:flex; flex-direction:column; gap:6px; }
        .legal-toc a { font-size:.9rem; color:var(--dark); text-decoration:none; transition:color .15s; }
        .legal-toc a:hover { color:var(--red); }
        .legal-article { display:flex; flex-direction:column; gap:48px; }
        .legal-article section { display:flex; flex-direction:column; gap:14px; }
        .legal-article h2 { font-size:1.2rem; font-weight:700; color:var(--dark); display:flex; align-items:baseline; gap:8px; padding-bottom:12px; border-bottom:2px solid var(--gray-200); }
        .legal-num { color:var(--red); font-weight:800; font-size:1rem; min-width:24px; }
        .legal-article h3 { font-size:.95rem; font-weight:700; color:var(--gray-900); margin-top:8px; }
        .legal-article p { font-size:.95rem; color:var(--gray-700); line-height:1.75; }
        .legal-article ul,.legal-article ol { padding-left:22px; display:flex; flex-direction:column; gap:8px; }
        .legal-article li { font-size:.95rem; color:var(--gray-700); line-height:1.6; }
        .legal-article a { color:var(--red); text-decoration:underline; text-decoration-color:rgba(232,35,42,.3); }
        .legal-article a:hover { text-decoration-color:var(--red); }
        .legal-article strong { color:var(--gray-900); }
        .legal-contact-card { display:flex; gap:32px; background:var(--white); border:1px solid var(--gray-200); border-radius:var(--r12); padding:24px 28px; flex-wrap:wrap; }
        .legal-contact-card > div { display:flex; flex-direction:column; gap:4px; }
        .legal-contact-card strong { font-size:1rem; color:var(--dark); }
        .legal-contact-card span,.legal-contact-card a { font-size:.9rem; color:var(--muted); }
        .legal-contact-card a { color:var(--red); text-decoration:underline; text-decoration-color:rgba(232,35,42,.3); }
        @media (max-width:600px) { .legal-body { padding:40px 16px 72px; } .legal-toc,.legal-contact-card { padding:20px; } .legal-contact-card { flex-direction:column; gap:16px; } }
      `}</style>
    </>
  );
}