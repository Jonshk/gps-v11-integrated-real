"use client";

import { useState } from "react";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "GPS Control EC";
const PHONE = "593987654321";

const NAV = [
  { href: "#solucion", label: "Solucion" },
  { href: "#impacto",  label: "Por que nosotros" },
  { href: "#panel",    label: "Panel" },
  { href: "#planes",   label: "Planes" },
];

export default function TopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <a href="/" className="brand">
          <svg className="brand-icon" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
            <circle cx="14" cy="12" r="3" fill="currentColor"/>
            <path d="M14 20 L14 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="26" r="1.5" fill="currentColor"/>
          </svg>
          <span>{BRAND}</span>
        </a>

        <nav className="topnav">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>{n.label}</a>
          ))}
        </nav>

        <div className="topbar-right">
          <a href={`tel:+${PHONE}`} className="nav-phone">
            +593 98 765 4321
          </a>
          <a
            href={`https://wa.me/${PHONE}?text=Hola, quiero una demo`}
            target="_blank"
            rel="noreferrer"
            className="nav-cta"
          >
            Solicitar demo
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

      <nav className={`mobile-nav ${open ? "open" : ""}`}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>
        ))}
        <a
          href={`https://wa.me/${PHONE}`}
          target="_blank"
          rel="noreferrer"
          className="mobile-cta"
          onClick={() => setOpen(false)}
        >
          Solicitar demo por WhatsApp
        </a>
      </nav>
    </>
  );
}