"use client";

import { useEffect, useState } from "react";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "GPS Control EC";
const PHONE = "593987654321";

const NAV = [
  { href: "#solucion", label: "Solucion" },
  { href: "#panel",    label: "Panel" },
  { href: "#impacto",  label: "Impacto" },
  { href: "#planes",   label: "Planes" },
  { href: "#contacto", label: "Contacto" },
];

export default function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="topbar">
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
          <a className="nav-phone" href={`tel:+${PHONE}`}>
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
            +593 98 765 4321
          </a>
          <a className="nav-cta" href={`https://wa.me/${PHONE}?text=Hola, quiero una demo`} target="_blank" rel="noreferrer">
            Demo gratis
          </a>
          <button
            className={`burger ${open ? "open" : ""}`}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className={`mobile-nav ${open ? "open" : ""}`}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>
        ))}
        <a
          className="mobile-cta"
          href={`https://wa.me/${PHONE}`}
          target="_blank" rel="noreferrer"
          onClick={() => setOpen(false)}
        >
          Demo gratis por WhatsApp
        </a>
      </div>
    </>
  );
}