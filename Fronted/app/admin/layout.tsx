"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeProvider, useTheme, Theme, THEMES } from "@/lib/theme";

const NAV = [
  { href: "/admin/clientes",     label: "Clientes",     icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/admin/vehiculos",    label: "Vehículos",    icon: "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-1 11a2 2 0 100-4 2 2 0 000 4zm-9 0a2 2 0 100-4 2 2 0 000 4zm10-7H9m4-4H9" },
  { href: "/admin/dispositivos", label: "Dispositivos", icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
  { href: "/admin/asignaciones", label: "Asignar",      icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/comandos",     label: "Comandos SMS", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", badge: true },
  { href: "/admin/planes",       label: "Planes",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/admin/logs",         label: "Logs",         icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const THEME_ICONS = {
  light: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z",
  dim:   "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z",
  dark:  "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z",
};

function NavItem({ n, active }: { n: typeof NAV[0]; active: boolean }) {
  const { t } = useTheme();
  const [hov, setHov] = useState(false);
  return (
    <Link href={n.href}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 10, marginBottom: 2,
        background: active ? "rgba(232,35,42,0.1)" : hov ? t.border : "transparent",
        border: `1px solid ${active ? "rgba(232,35,42,0.25)" : "transparent"}`,
        borderLeft: `3px solid ${active ? "#e8232a" : "transparent"}`,
        color: active ? "#e8232a" : hov ? t.text : t.textMuted,
        fontSize: 13, fontWeight: active ? 700 : 500,
        textDecoration: "none", transition: "all 0.15s",
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={n.icon} />
      </svg>
      <span style={{ flex: 1 }}>{n.label}</span>
      {n.badge && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e8232a", boxShadow: "0 0 8px rgba(232,35,42,0.5)", animation: "liveDot 2s infinite" }} />}
    </Link>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { t, theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin") { setReady(true); return; }
    const token = localStorage.getItem("admin_token");
    if (!token) { router.replace("/admin"); return; }
    setReady(true);
  }, [pathname, router]);

  function logout() { localStorage.removeItem("admin_token"); router.replace("/admin"); }

  if (pathname === "/admin") return <>{children}</>;
  if (!ready) return null;

  const themeOrder: Theme[] = ["light", "dim", "dark"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", transition: "background 0.3s" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 224, flexShrink: 0, background: t.sidebar, backdropFilter: "blur(20px)",
        borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column",
        height: "100vh", position: "sticky", top: 0, transition: "background 0.3s, border-color 0.3s" }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(232,35,42,0.1)",
              border: "1px solid rgba(232,35,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="10" r="6" stroke="#e8232a" strokeWidth="2" />
                <circle cx="12" cy="10" r="2.5" fill="#e8232a" />
                <path d="M12 16v5" stroke="#e8232a" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ color: t.text, fontWeight: 800, fontSize: 13, letterSpacing: "-0.3px" }}>GPS Control EC</div>
              <div style={{ color: t.textFaint, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Panel Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {NAV.map(n => <NavItem key={n.href} n={n} active={pathname.startsWith(n.href)} />)}
        </nav>

        {/* Theme toggle + footer */}
        <div style={{ padding: "10px 10px 14px", borderTop: `1px solid ${t.border}` }}>

          {/* Toggle tema */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 10px", borderRadius: 10, background: t.border, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: t.textFaint, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tema</span>
            <div style={{ display: "flex", gap: 2 }}>
              {themeOrder.map(th => (
                <button key={th} onClick={() => setTheme(th)} title={th} style={{
                  width: 26, height: 26, borderRadius: 7, border: "none",
                  background: theme === th ? "#e8232a" : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={theme === th ? "#fff" : t.textMuted}>
                    <path d={THEME_ICONS[th]} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
            borderRadius: 8, color: t.textFaint, fontSize: 12, textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = t.textMuted)}
            onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Ver web pública
          </Link>
          <button onClick={logout} style={{ width: "100%", padding: "7px 10px", marginTop: 1,
            background: "none", border: "none", cursor: "pointer", color: t.textFaint,
            fontSize: 12, textAlign: "left", borderRadius: 8, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#e8232a")}
            onMouseLeave={e => (e.currentTarget.style.color = t.textFaint)}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main style={{ flex: 1, overflow: "auto", background: t.bg, transition: "background 0.3s" }}>
        {children}
      </main>

      <style>{`
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ThemeProvider>
  );
}