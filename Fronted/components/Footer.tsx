export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <svg className="footer-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="14" r="9" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="16" cy="14" r="3.5" fill="currentColor" />
            <path d="M16 23 Q16 30 16 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="16" cy="30" r="1.5" fill="currentColor" />
          </svg>
          <span>GPS Control EC</span>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <span className="footer-col-title">Contacto</span>
            <a href="tel:+593987654321">+593 98 765 4321</a>
            <a href="mailto:contacto@gpscontrolec.com">contacto@gpscontrolec.com</a>
            <a
              href="https://maps.google.com/?q=Guayaquil,Ecuador"
              target="_blank"
              rel="noreferrer"
            >
              Guayaquil, Ecuador
            </a>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Producto</span>
            <a href="#solucion">Solucion</a>
            <a href="#panel">Panel en vivo</a>
            <a href="#planes">Planes</a>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Legal</span>
            <a href="#">Privacidad</a>
            <a href="#">Terminos de uso</a>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Hablar ahora</span>
            <a
              className="footer-wa"
              href="https://wa.me/593987654321"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.847L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.214-3.727.977.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>2024 GPS Control EC. Todos los derechos reservados.</span>
        <span>Guayaquil, Ecuador</span>
      </div>
    </footer>
  );
}