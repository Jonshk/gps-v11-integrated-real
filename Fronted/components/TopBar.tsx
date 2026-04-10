const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "GPS Control EC";
const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "593XXXXXXXXX";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">G</span>
        <span>{BRAND}</span>
      </div>

      <nav className="topnav">
        <a href="#solucion">Solución</a>
        <a href="#panel">Panel</a>
        <a href="#impacto">Impacto</a>
        <a href="#planes">Planes</a>
        <a href="#contacto">Contacto</a>
      </nav>

      <a className="nav-cta" href={`https://wa.me/${PHONE}`} target="_blank">
        Conseguir una demo
      </a>
    </header>
  );
}
