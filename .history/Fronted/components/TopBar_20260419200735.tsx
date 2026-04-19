"use client";

import { useEffect, useState } from "react";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "GPS Control EC";
const PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || "593XXXXXXXXX";

const NAV = [
  { href: "#solucion", label: "Solución" },
  { href: "#panel",    label: "Panel" },
  { href: "#impacto",  label: "Impacto" },
  { href: "#planes",   label: "Planes" },
  { href: "#contacto", label: "Contacto" },
];

export default function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`topbar ${scrolled ? "scrolled" : ""}`}>
        <div className="brand">
          <svg className="brand-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="14" r="9" stroke="currentColor" strokeWidth="2.2"/>
            <circle cx="16" cy="14" r="3.5" fill="currentColor"/>
            <path d="M16 23 Q16 30 16 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="16" cy="30" r="1.5" fill="currentColor"/>
          </svg>
          <span>{BRAND}</span>
        </div>

        <nav className="topnav">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>{n.label}</a>
          ))}
        </nav>

        <div className="topbar-right">
          <a className="nav-cta" href={`https://wa.me/${PHONE}`} target="_blank" rel="noreferrer">
            Conseguir una demo
          </a>
          <button
            className={`burger ${open ? "open" : ""}`}
            aria-label="Menú"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-nav ${open ? "open" : ""}`}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
            {n.label}
          </a>
        ))}
        
          className="mobile-cta"
          href={`https://wa.me/${PHONE}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpen(false)}
        >
          Conseguir una demo
        </a>
      </div>
    </>
  );
}