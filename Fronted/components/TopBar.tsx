"use client";

import { useState, useEffect } from "react";

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
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.85);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`topbar ${solid ? "solid" : ""}`}>
        <a href="/" className="brand">
          <svg className="brand-icon" viewBox="0 0 28 28" fill="none">
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

        {/* Trust chips dentro del nav */}
        <div className="topbar-trust">
          <span className="tb-trust-chip">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            4.8/5
          </span>
          <span className="tb-trust-sep" />
          <a
            href={`https://wa.me/${PHONE}`}
            target="_blank"
            rel="noreferrer"
            className="tb-trust-chip tb-trust-wa"
          >
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            WhatsApp 24/7
          </a>
        </div>

        <div className="topbar-right">
          <a href={`tel:+${PHONE}`} className="nav-phone">+593 98 765 4321</a>
          <a
            href={`https://wa.me/${PHONE}?text=Quiero una demo`}
            target="_blank"
            rel="noreferrer"
            className="nav-cta"
          >
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
          Demo gratis por WhatsApp
        </a>
      </nav>
    </>
  );
}