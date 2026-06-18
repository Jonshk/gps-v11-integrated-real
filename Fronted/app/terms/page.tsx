import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Uso — GPS Control EC",
  description: "Condiciones que regulan el uso del servicio de rastreo GPS de GPS Control EC.",
};

const LAST_UPDATE = "1 de junio de 2025";
const EMAIL = "contacto@gpscontrolec.com";
const COMPANY = "GPS Control EC";

export default function TermsPage() {
  return (
    <>
      <TopBar />
      <main style={{ paddingTop: 64 }}>
        <section className="legal-hero">
          <div className="legal-hero-inner">
            <span className="legal-badge">Legal</span>
            <h1>Términos de Uso</h1>
            <p>Última actualización: {LAST_UPDATE}</p>
          </div>
        </section>
        <section className="legal-body">
          <div className="legal-container">
            <div className="legal-alert">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>Estos términos constituyen un contrato vinculante. Al usar el servicio confirmas que los has leído y aceptado.</span>
            </div>
            <div className="legal-toc">
              <p className="legal-toc-title">Contenido</p>
              <ol>
                <li><a href="#aceptacion">Aceptación de los términos</a></li>
                <li><a href="#servicio">Descripción del servicio</a></li>
                <li><a href="#cuenta">Registro y cuenta de usuario</a></li>
                <li><a href="#uso-aceptable">Uso aceptable</a></li>
                <li><a href="#planes">Planes, pagos y facturación</a></li>
                <li><a href="#disponibilidad">Disponibilidad del servicio</a></li>
                <li><a href="#propiedad">Propiedad intelectual</a></li>
                <li><a href="#responsabilidad">Limitación de responsabilidad</a></li>
                <li><a href="#suspension">Suspensión y cancelación</a></li>
                <li><a href="#privacidad">Privacidad</a></li>
                <li><a href="#ley">Ley aplicable y jurisdicción</a></li>
                <li><a href="#modificaciones">Modificaciones a los términos</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ol>
            </div>
            <article className="legal-article">
              <section id="aceptacion">
                <h2><span className="legal-num">1.</span> Aceptación de los términos</h2>
                <p>Al registrarte o usar <strong>{COMPANY}</strong> aceptas estos Términos de Uso y nuestra <a href="/privacy">Política de Privacidad</a>. Si usas el servicio en nombre de una empresa, confirmas que tienes autoridad para aceptarlos en su nombre.</p>
              </section>
              <section id="servicio">
                <h2><span className="legal-num">2.</span> Descripción del servicio</h2>
                <p>{COMPANY} es una plataforma SaaS de rastreo y gestión de flotas vehiculares que incluye:</p>
                <ul>
                  <li>Rastreo GPS en tiempo real (dispositivos TK103, GT06 y similares)</li>
                  <li>Panel administrativo web</li>
                  <li>Aplicación móvil para Android</li>
                  <li>Envío de comandos remotos vía SMS o datos</li>
                  <li>Historial de recorridos, geocercas y alertas</li>
                  <li>Reportes de actividad de flota</li>
                </ul>
                <p>{COMPANY} no es responsable por el funcionamiento del hardware ni de la cobertura del operador de telefonía.</p>
                <h3>Activación del servicio y mensajería SMS</h3>
                <p>Para activar el Servicio, el cliente se contacta con nuestro equipo a través de WhatsApp, donde confirma el plan deseado y acepta estos Términos de Uso y la Política de Privacidad antes de que activemos su dispositivo GPS en la plataforma. Una vez activado, el dispositivo GPS instalado en el vehículo (identificado por su número SIM, no el teléfono personal del usuario) intercambia mensajes SMS con nuestra plataforma para recibir comandos (solicitud de ubicación, configuración de alertas de movimiento, geocercas) y enviar reportes de estado. El usuario puede solicitar la baja del Servicio en cualquier momento contactando a soporte vía WhatsApp, lo cual resulta en la desactivación de la cuenta y el cese de esta comunicación SMS.</p>
              </section>
              <section id="cuenta">
                <h2><span className="legal-num">3.</span> Registro y cuenta de usuario</h2>
                <ul>
                  <li>Debes proporcionar información veraz y actualizada</li>
                  <li>Ser mayor de 18 años o contar con autorización legal para contratar</li>
                  <li>Mantener la confidencialidad de tus credenciales</li>
                  <li>Notificarnos de inmediato si sospechas acceso no autorizado</li>
                </ul>
                <p>Está prohibido compartir, vender o transferir tu cuenta sin consentimiento previo por escrito de {COMPANY}.</p>
              </section>
              <section id="uso-aceptable">
                <h2><span className="legal-num">4.</span> Uso aceptable</h2>
                <p>Al usar el servicio te comprometes a <strong>no</strong>:</p>
                <ul>
                  <li>Rastrear personas sin su consentimiento explícito (LOPDP Ecuador)</li>
                  <li>Acceder a cuentas o datos de otros usuarios sin autorización</li>
                  <li>Realizar ingeniería inversa o descompilar el Servicio</li>
                  <li>Introducir virus o código malicioso</li>
                  <li>Usar el Servicio para actividades ilegales o fraudulentas</li>
                  <li>Sobrecargar intencionalmente la infraestructura (DDoS)</li>
                  <li>Revender el acceso sin autorización expresa</li>
                </ul>
              </section>
              <section id="planes">
                <h2><span className="legal-num">5.</span> Planes, pagos y facturación</h2>
                <p>Los planes (Básico, Pro, Flotas) se facturan mensualmente por adelantado. Los precios vigentes están en <a href="/#planes">gpscontrolec.com/#planes</a> y pueden actualizarse con 30 días de aviso.</p>
                <p>No se realizan reembolsos por periodos ya facturados, salvo interrupciones del servicio mayores a 72 horas imputables a {COMPANY}. Ante falta de pago por más de 5 días el acceso puede suspenderse, conservando los datos 30 días adicionales.</p>
              </section>
              <section id="disponibilidad">
                <h2><span className="legal-num">6.</span> Disponibilidad del servicio</h2>
                <p>{COMPANY} aspira a un uptime del 99% mensual, excluyendo mantenimientos programados anunciados con 24 horas de anticipación. No garantizamos disponibilidad ininterrumpida ya que dependemos de proveedores externos (Render, Vercel, operadoras).</p>
              </section>
              <section id="propiedad">
                <h2><span className="legal-num">7.</span> Propiedad intelectual</h2>
                <p>Todo el software, diseño, logotipos e interfaces son propiedad de {COMPANY}. Te concedemos una licencia limitada, no exclusiva e intransferible para usar el Servicio. Los datos de tu flota son de tu propiedad; {COMPANY} solo los procesa para prestarte el Servicio.</p>
              </section>
              <section id="responsabilidad">
                <h2><span className="legal-num">8.</span> Limitación de responsabilidad</h2>
                <p>{COMPANY} <strong>no será responsable</strong> por daños indirectos, pérdida de datos, decisiones basadas en información del Servicio, fallas de cobertura GSM/GPRS ni acceso no autorizado por negligencia del usuario. La responsabilidad total no superará el monto pagado en los últimos 3 meses.</p>
              </section>
              <section id="suspension">
                <h2><span className="legal-num">9.</span> Suspensión y cancelación</h2>
                <p>Puedes cancelar en cualquier momento contactando a soporte. La cancelación aplica al final del ciclo en curso y tus datos se conservan 30 días adicionales. Podemos suspender tu acceso por incumplimiento de estos términos, falta de pago, actividad fraudulenta o requerimiento legal.</p>
              </section>
              <section id="privacidad">
                <h2><span className="legal-num">10.</span> Privacidad</h2>
                <p>El tratamiento de tus datos se rige por nuestra <a href="/privacy">Política de Privacidad</a>, que forma parte integral de estos Términos.</p>
              </section>
              <section id="ley">
                <h2><span className="legal-num">11.</span> Ley aplicable y jurisdicción</h2>
                <p>Estos términos se rigen por las leyes de la República del Ecuador. Cualquier disputa se someterá a los tribunales competentes de Guayaquil, Ecuador.</p>
              </section>
              <section id="modificaciones">
                <h2><span className="legal-num">12.</span> Modificaciones a los términos</h2>
                <p>Notificaremos cambios materiales por correo con al menos 15 días de anticipación. El uso continuado tras la fecha de vigencia implica aceptación.</p>
              </section>
              <section id="contacto">
                <h2><span className="legal-num">13.</span> Contacto</h2>
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
        .legal-alert { display:flex; align-items:flex-start; gap:12px; background:rgba(232,35,42,.06); border:1px solid rgba(232,35,42,.18); border-radius:var(--r12); padding:16px 20px; margin-bottom:36px; font-size:.9rem; color:var(--gray-700); line-height:1.5; }
        .legal-alert svg { width:20px; height:20px; color:var(--red); flex-shrink:0; margin-top:1px; }
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